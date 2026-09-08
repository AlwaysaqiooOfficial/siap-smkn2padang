import { prisma } from "../config/db";
import { env } from "../config/env";

// Fungsi tanggal/waktu murni dipindah ke dateTime.ts (tanpa dependensi Prisma) — di-re-export
// di sini agar seluruh kode lain yang sudah `import { serverDateOnly } from "./schoolSettings"`
// TETAP jalan tanpa perlu diubah satu per satu.
export { timeStringToMinutes, nowMinutesOfDay, serverDateOnly } from "./dateTime";

export interface AttendanceRules {
  startTime: string; // "HH:mm"
  lateAfter: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

/**
 * Mengambil aturan jam absensi dari tabel school_settings (dapat diubah admin tanpa redeploy).
 * Jika belum diset, fallback ke .env.
 */
export async function getAttendanceRules(): Promise<AttendanceRules> {
  const [startSetting, lateSetting, endSetting] = await Promise.all([
    prisma.schoolSetting.findUnique({ where: { key: "attendance_start_time" } }),
    prisma.schoolSetting.findUnique({ where: { key: "attendance_late_after" } }),
    prisma.schoolSetting.findUnique({ where: { key: "attendance_end_time" } }),
  ]);

  return {
    startTime: startSetting?.value ?? env.ATTENDANCE_START_TIME,
    lateAfter: lateSetting?.value ?? env.ATTENDANCE_LATE_AFTER,
    endTime: endSetting?.value ?? env.ATTENDANCE_END_TIME,
  };
}

/** Jam pemicu job auto-alfa ("HH:mm"), diambil dari school_settings — TIDAK hard-coded. */
export async function getAutoAlfaCronTime(): Promise<string> {
  try {
    const setting = await prisma.schoolSetting.findUnique({ where: { key: "auto_alfa_cron_time" } });
    return setting?.value ?? env.AUTO_ALFA_CRON_TIME;
  } catch (err) {
    // Fallback jika Prisma tidak tersedia (DATABASE_URL tidak ada)
    return env.AUTO_ALFA_CRON_TIME;
  }
}

/**
 * Ambang batas poin pelanggaran agar email ke orang tua dikirim ("pelanggaran tertentu"),
 * diambil dari school_settings (key: violation_notify_min_points). Default 10 jika belum diset.
 */
export async function getViolationNotifyThreshold(): Promise<number> {
  try {
    const setting = await prisma.schoolSetting.findUnique({
      where: { key: "violation_notify_min_points" },
    });
    const parsed = Number(setting?.value);
    return Number.isFinite(parsed) ? parsed : 10;
  } catch (err) {
    // Fallback jika Prisma tidak tersedia
    return 10;
  }
}
