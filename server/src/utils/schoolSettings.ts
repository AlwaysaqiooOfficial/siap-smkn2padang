import { env } from "../config/env";
import { SchoolSettingRepository } from "../services/repositories";

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
  const getSetting = (key: string) => SchoolSettingRepository.findFirst((setting) => setting.key === key || setting.id === key)?.value;

  return {
    startTime: getSetting("attendance_start_time") ?? env.ATTENDANCE_START_TIME,
    lateAfter: getSetting("attendance_late_after") ?? env.ATTENDANCE_LATE_AFTER,
    endTime: getSetting("attendance_end_time") ?? env.ATTENDANCE_END_TIME,
  };
}

/** Jam pemicu job auto-alfa ("HH:mm"), diambil dari school_settings — TIDAK hard-coded. */
export async function getAutoAlfaCronTime(): Promise<string> {
  try {
    return SchoolSettingRepository.findFirst((setting) => setting.key === "auto_alfa_cron_time" || setting.id === "auto_alfa_cron_time")?.value ?? env.AUTO_ALFA_CRON_TIME;
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
    const setting = SchoolSettingRepository.findFirst((item) => item.key === "violation_notify_min_points" || item.id === "violation_notify_min_points");
    const parsed = Number(setting?.value);
    return Number.isFinite(parsed) ? parsed : 10;
  } catch (err) {
    // Fallback jika Prisma tidak tersedia
    return 10;
  }
}
