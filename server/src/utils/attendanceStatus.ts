export type ScanDeterminedStatus = "HADIR" | "TERLAMBAT";

/**
 * Menentukan status HADIR/TERLAMBAT murni dari perbandingan menit — tidak menyentuh DB/waktu
 * sistem sama sekali, sehingga 100% deterministik dan mudah diuji (lihat attendanceStatus.test.ts).
 * Dipakai oleh attendance.service.ts setelah waktu SERVER & aturan school_settings diambil.
 */
export function determineAttendanceStatus(
  currentMinutes: number,
  lateAfterMinutes: number
): ScanDeterminedStatus {
  return currentMinutes < lateAfterMinutes ? "HADIR" : "TERLAMBAT";
}
