import { prisma } from "../config/db";
import { getFromAddress, getTransporter, isSmtpConfigured } from "../config/mailer";
import { logger } from "./logger";

const SAFETY_NET_INTERVAL_MS = 15 * 1000; // jaring pengaman: cek ulang tiap 15 detik
const BATCH_SIZE = 20;

let isProcessing = false;

async function sendOne(emailLogId: string) {
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

  try {
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
  } catch (err) {
    // Email gagal TIDAK PERNAH dilempar ke pemanggil — hanya dicatat di email_logs.
    const message = err instanceof Error ? err.message : "Gagal mengirim email (unknown error)";
    logger.error(`[email] Gagal mengirim ke ${log.toEmail}:`, message);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 500) },
    });
  }
}

/** Memproses semua email_logs berstatus PENDING (dipanggil setelah enqueue & oleh safety-net interval). */
async function processPendingBatch() {
  if (isProcessing) return;
  isProcessing = true;
  try {
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
