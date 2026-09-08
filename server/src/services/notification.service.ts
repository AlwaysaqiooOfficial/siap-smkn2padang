import { prisma } from "../config/db";

/**
 * Membuat notifikasi in-app untuk seorang user. Tidak pernah melempar error ke pemanggil —
 * kegagalan notifikasi tidak boleh menggagalkan proses utama (absensi/izin/dsb), sama seperti
 * prinsip email_logs di Phase 5.
 */
export async function notifyUser(userId: string, title: string, message: string) {
  try {
    await prisma.notification.create({ data: { userId, title, message } });
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
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { parent: { select: { userId: true } } },
  });

  if (student?.parent?.userId) {
    await notifyUser(student.parent.userId, title, message);
  }
}
