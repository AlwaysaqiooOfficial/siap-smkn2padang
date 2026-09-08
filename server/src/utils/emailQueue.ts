import { prisma } from "../config/db";
import { env } from "../config/env";
import { getFromAddress, getTransporter, isSmtpConfigured } from "../config/mailer";
import { logger } from "./logger";

const SAFETY_NET_INTERVAL_MS = 15 * 1000; // jaring pengaman: cek ulang tiap 15 detik
const BATCH_SIZE = 20;

let isProcessing = false;

// Check if Prisma is available (DATABASE_URL exists)
const isPrismaAvailable = () => {
  return !!env.DATABASE_URL && env.DATABASE_URL.length > 0;
};

async function sendOne(emailLogId: string) {
  if (!isPrismaAvailable()) return; // Skip if no database

  try {
    const log = await prisma.emailLog.findUnique({ where: { id: emailLogId } });
    if (!log || log.status !== "PENDING") return; // sudah diproses job lain / tidak ditemukan

    if (!isSmtpConfigured()) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: "SMTP belum dikonfigurasi (isi SMTP_HOST/SMTP_USER/SMTP_PASS di .env)",
        },
      });
      return;
    }

    const transporter = getTransporter()!;
    await transporter.sendMail({
      from: getFromAddress(),
      to: log.toEmail,
      subject: log.subject,
      html: log.body,
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date(), errorMessage: null },
    });

    // Jika email berhasil terkirim dan terkait attendance, tandai emailSent = true
    if (log.relatedType === "ATTENDANCE" && log.relatedId) {
      const attendance = await prisma.attendance.findUnique({
        where: { id: log.relatedId },
        select: { studentId: true },
      });
      if (attendance) {
        await prisma.student.update({
          where: { id: attendance.studentId },
          data: { emailSent: true },
        }).catch((err) => {
          logger.error(`[email] Gagal update emailSent untuk student:`, err);
        });
      }
    }
  } catch (err) {
    // Email gagal TIDAK PERNAH dilempar ke pemanggil — hanya dicatat di email_logs.
    const message = err instanceof Error ? err.message : "Gagal mengirim email (unknown error)";
    logger.error(`[email] Gagal mengirim:`, message);
  }
}

/** Memproses semua email_logs berstatus PENDING (dipanggil setelah enqueue & oleh safety-net interval). */
async function processPendingBatch() {
  if (isProcessing) return;
  if (!isPrismaAvailable()) return; // Skip if no database
  
  isProcessing = true;
  try {
    try {
      // Hanya proses email yang dibuat HARI INI — pastikan system restart tidak mengirim ulang email lama
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const pending = await prisma.emailLog.findMany({
        where: {
          status: "PENDING",
          createdAt: { gte: startOfToday },
        },
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        select: { id: true },
      });

      for (const item of pending) {
        // eslint-disable-next-line no-await-in-loop
        await sendOne(item.id);
      }
    } catch (err) {
      // Gracefully skip jika Prisma tidak tersedia
      if (err instanceof Error && err.message.includes("Can't reach database server")) {
        logger.info("[email] Database not available, skipping email batch");
        return;
      }
      throw err;
    }
  } catch (err) {
    logger.error("[email] Gagal memproses batch email_logs:", err);
  } finally {
    isProcessing = false;
  }
}

/**
 * Memicu pemrosesan queue SEGERA tanpa memblokir pemanggil (fire-and-forget).
 * email_logs sudah tersimpan sebagai PENDING sebelum fungsi ini dipanggil, jadi
 * proses pengiriman aktual berjalan di background — tidak pernah menggagalkan
 * transaksi absensi/izin yang memicunya.
 */
export function triggerEmailProcessing() {
  setImmediate(() => {
    processPendingBatch().catch((err) => logger.error("[email] Worker error:", err));
  });
}

/**
 * Dipanggil sekali saat server startup:
 * 1. Jaring pengaman berkala (menangkap email PENDING yang tertinggal, mis. setelah restart).
 * 2. Langsung memproses PENDING yang mungkin tersisa dari sesi sebelumnya.
 */
export function startEmailWorker() {
  triggerEmailProcessing();
  const interval = setInterval(() => {
    processPendingBatch().catch((err) => logger.error("[email] Safety-net worker error:", err));
  }, SAFETY_NET_INTERVAL_MS);
  return () => clearInterval(interval);
}
