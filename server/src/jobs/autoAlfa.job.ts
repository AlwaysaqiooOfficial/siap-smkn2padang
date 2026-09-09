import { getAutoAlfaCronTime, nowMinutesOfDay, timeStringToMinutes } from "../utils/schoolSettings";
import { runAutoAlfaJob } from "../services/autoAlfa.service";
import { logger } from "../utils/logger";

const CHECK_INTERVAL_MS = 60 * 1000; // cek setiap 1 menit

let lastRunDateKey: string | null = null;
let isRunning = false;

function todayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function maybeRunAutoAlfa() {
  if (isRunning) return; // hindari overlap jika satu run belum selesai

  try {
    const cronTime = await getAutoAlfaCronTime(); // dibaca dari school_settings tiap kali, TIDAK hard-coded
    const now = new Date();
    const currentKey = todayKey(now);

    const alreadyRunToday = lastRunDateKey === currentKey;
    const pastCutoff = nowMinutesOfDay(now) >= timeStringToMinutes(cronTime);

    if (!alreadyRunToday && pastCutoff) {
      isRunning = true;
      lastRunDateKey = currentKey; // tandai duluan agar tidak ke-trigger dobel dalam interval yang sama
      logger.info(`[auto-alfa] Menjalankan job (batas waktu terkonfigurasi: ${cronTime})`);
      const result = await runAutoAlfaJob();
      logger.info(`[auto-alfa] Hasil:`, result);
    }
  } catch (err) {
    logger.error("[auto-alfa] Gagal menjalankan scheduler:", err);
  } finally {
    isRunning = false;
  }
}

/**
 * Memulai scheduler auto-alfa. Mengecek tiap menit apakah waktu server sudah melewati
 * jam yang dikonfigurasi admin di school_settings (key: auto_alfa_cron_time).
 * Idempotent per hari (lastRunDateKey) + idempotent di level data (unique constraint DB),
 * sehingga aman dari restart server maupun overlap job.
 */
export function startAutoAlfaScheduler() {
  // Catch-up: jika server baru menyala setelah jam cutoff hari ini, langsung cek sekali.
  void maybeRunAutoAlfa();
  const interval = setInterval(maybeRunAutoAlfa, CHECK_INTERVAL_MS);
  return () => clearInterval(interval);
}
