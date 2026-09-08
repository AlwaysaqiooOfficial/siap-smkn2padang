/**
 * Fungsi tanggal/waktu murni — TIDAK mengimpor Prisma/env sama sekali, sengaja dipisah dari
 * schoolSettings.ts agar bisa diuji (lihat __tests__) tanpa perlu "prisma generate" atau
 * koneksi database apa pun. schoolSettings.ts re-export semua fungsi di sini untuk
 * kompatibilitas mundur (kode lain yang sudah meng-import dari situ tidak perlu berubah).
 */

/** Ubah "HH:mm" menjadi total menit sejak 00:00, untuk perbandingan numerik yang aman. */
export function timeStringToMinutes(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

/** Mengambil menit-dalam-hari dari waktu SERVER saat ini (bukan dari client/browser). */
export function nowMinutesOfDay(serverNow: Date): number {
  return serverNow.getHours() * 60 + serverNow.getMinutes();
}

/** Tanggal lokal sebagai UTC midnight, agar konsisten dengan kolom MySQL @db.Date. */
export function serverDateOnly(serverNow: Date): Date {
  return new Date(Date.UTC(serverNow.getFullYear(), serverNow.getMonth(), serverNow.getDate()));
}
