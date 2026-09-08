import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import type { CreateClassInput, UpdateClassInput } from "../schemas/class.schema";

const includeDefault = {
  major: true,
  homeroomTeacher: { select: { id: true, fullName: true, nip: true } },
  _count: { select: { students: true } },
};

export async function listClasses(filter: { majorId?: string }) {
  return prisma.class.findMany({
    where: { majorId: filter.majorId },
    include: includeDefault,
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });
}

export async function getClassById(id: string) {
  const kelas = await prisma.class.findUnique({ where: { id }, include: includeDefault });
  if (!kelas) throw new AppError("Kelas tidak ditemukan", 404);
  return kelas;
}

async function assertHomeroomTeacherValid(teacherId: string, ignoreClassId?: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { homeroomClass: true, user: true },
  });
  if (!teacher) throw new AppError("Guru wali kelas tidak ditemukan", 404);
  if (teacher.user.role !== "WALI_KELAS" && teacher.user.role !== "GURU") {
    throw new AppError("Akun yang ditunjuk harus merupakan akun guru", 422);
  }
  if (teacher.homeroomClass && teacher.homeroomClass.id !== ignoreClassId) {
    throw new AppError(
      `Guru ini sudah menjadi wali kelas di ${teacher.homeroomClass.name}`,
      409
    );
  }
}

export async function createClass(input: CreateClassInput) {
  const major = await prisma.major.findUnique({ where: { id: input.majorId } });
  if (!major) throw new AppError("Jurusan tidak ditemukan", 404);

  const duplicate = await prisma.class.findFirst({
    where: { name: input.name, majorId: input.majorId },
  });
  if (duplicate) throw new AppError("Nama kelas sudah ada pada jurusan ini", 409);

  if (input.homeroomTeacherId) {
    await assertHomeroomTeacherValid(input.homeroomTeacherId);
  }

  return prisma.class.create({ data: input, include: includeDefault });
}

export async function updateClass(id: string, input: UpdateClassInput) {
  await getClassById(id);

  if (input.majorId) {
    const major = await prisma.major.findUnique({ where: { id: input.majorId } });
    if (!major) throw new AppError("Jurusan tidak ditemukan", 404);
  }

  if (input.homeroomTeacherId) {
    await assertHomeroomTeacherValid(input.homeroomTeacherId, id);
  }

  return prisma.class.update({ where: { id }, data: input, include: includeDefault });
}

export async function deleteClass(id: string) {
  const kelas = await getClassById(id);
  if (kelas._count.students > 0) {
    throw new AppError("Kelas tidak dapat dihapus karena masih memiliki siswa aktif", 409);
  }
  await prisma.class.delete({ where: { id } });
}
