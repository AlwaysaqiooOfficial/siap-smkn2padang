import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";

/**
 * Mengambil classId yang menjadi tanggung jawab seorang WALI_KELAS berdasarkan userId.
 * Dipakai untuk membatasi akses WALI_KELAS hanya ke kelasnya sendiri (students, attendance, dst).
 */
export async function getHomeroomClassId(userId: string, teacherId?: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({
    where: teacherId ? { id: teacherId } : { userId },
    include: { homeroomClass: true },
  });

  if (!teacher || !teacher.homeroomClass) {
    throw new AppError("Akun ini belum ditugaskan sebagai wali kelas di kelas manapun", 403);
  }

  return teacher.homeroomClass.id;
}

/** Mengambil id record Teacher dari userId yang sedang login (dipakai saat GURU membuat laporan). */
export async function getTeacherIdByUserId(userId: string, teacherId?: string): Promise<string> {
  if (teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new AppError("Guru tidak ditemukan", 403);
    return teacher.id;
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    throw new AppError("Akun ini tidak terdaftar sebagai guru", 403);
  }
  return teacher.id;
}

/** Mengambil id record Student dari userId yang sedang login (dipakai untuk dashboard siswa). */
export async function getStudentIdByUserId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new AppError("Akun ini belum terhubung ke data siswa manapun", 403);
  }
  return student.id;
}

/** Mengambil id record Parent dari userId yang sedang login (dipakai untuk dashboard orang tua). */
export async function getParentIdByUserId(userId: string): Promise<string> {
  const parent = await prisma.parent.findUnique({ where: { userId } });
  if (!parent) {
    throw new AppError("Akun ini tidak terdaftar sebagai orang tua", 403);
  }
  return parent.id;
}
