import { env } from "../config/env";
import { getFromAddress, getTransporter, isSmtpConfigured } from "../config/mailer";
import { logger } from "./logger";
import { findAll, findOne, transaction } from "../services/jsonDatabase";

const SAFETY_NET_INTERVAL_MS = 15 * 1000; // jaring pengaman: cek ulang tiap 15 detik
const BATCH_SIZE = 20;

let isProcessing = false;

async function sendOne(emailLogId: string) {
  try {
    const log = findOne<any>("email_queue", emailLogId);
    if (!log || log.status !== "PENDING") return; // sudah diproses job lain / tidak ditemukan

    if (!isSmtpConfigured()) {
      await transaction(async (db) => {
        db.update("email_queue", log.id, {
          status: "FAILED",
          errorMessage: "SMTP belum dikonfigurasi (isi SMTP_HOST/SMTP_USER/SMTP_PASS di .env)",
        });
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

    await transaction(async (db) => {
      db.update("email_queue", log.id, { status: "SENT", sentAt: new Date().toISOString(), errorMessage: null });
    });

    // Jika email berhasil terkirim dan terkait attendance, tandai emailSent = true
    if (log.relatedType === "ATTENDANCE" && log.relatedId) {
      const attendance = findOne<any>("attendance", log.relatedId);
      if (attendance) {
        await transaction(async (db) => {
          db.update("students", attendance.studentId, { emailSent: true });
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
  isProcessing = true;
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const pending = findAll<any>("email_queue")
      .filter((item) => item.status === "PENDING" && new Date(item.createdAt) >= startOfToday)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, BATCH_SIZE);

    for (const item of pending) {
      await sendOne(item.id);
    }
  } catch (err) {
    logger.error("[email] Gagal memproses batch email_queue:", err);
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
