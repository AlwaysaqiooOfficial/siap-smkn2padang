import { findFirst, transaction } from "./jsonDatabase";

/**
 * Membuat notifikasi in-app untuk seorang user. Tidak pernah melempar error ke pemanggil —
 * kegagalan notifikasi tidak boleh menggagalkan proses utama (absensi/izin/dsb), sama seperti
 * prinsip email_logs di Phase 5.
 */
export async function notifyUser(userId: string, title: string, message: string) {
  try {
    await transaction(async (db) => {
      db.create("notifications", {
        id: crypto.randomUUID(),
        userId,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
  } catch {
    // Sengaja diabaikan — notifikasi bersifat best-effort, bukan bagian kritikal transaksi.
  }
}

/** Notifikasi ke orang tua siswa (jika siswa punya data orang tua dengan akun). */
export async function notifyParentOfStudent(
  studentId: string,
  title: string,
  message: string
) {
  const student = findFirst<any>("students", (item) => item.id === studentId);
  const parentUserId = student?.parent?.userId;
  if (parentUserId) {
    await notifyUser(parentUserId, title, message);
  }
}
