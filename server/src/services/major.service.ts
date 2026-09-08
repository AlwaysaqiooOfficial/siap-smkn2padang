import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import type { CreateMajorInput, UpdateMajorInput } from "../schemas/major.schema";

export async function listMajors() {
  return prisma.major.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { classes: true, students: true } } },
  });
}

export async function getMajorById(id: string) {
  const major = await prisma.major.findUnique({
    where: { id },
    include: { classes: true, _count: { select: { students: true } } },
  });
  if (!major) throw new AppError("Jurusan tidak ditemukan", 404);
  return major;
}

export async function createMajor(input: CreateMajorInput) {
  const exists = await prisma.major.findUnique({ where: { code: input.code } });
  if (exists) throw new AppError("Kode jurusan sudah digunakan", 409);
  return prisma.major.create({ data: input });
}

export async function updateMajor(id: string, input: UpdateMajorInput) {
  await getMajorById(id);
  if (input.code) {
    const exists = await prisma.major.findFirst({ where: { code: input.code, NOT: { id } } });
    if (exists) throw new AppError("Kode jurusan sudah digunakan", 409);
  }
  return prisma.major.update({ where: { id }, data: input });
}

export async function deleteMajor(id: string) {
  const major = await getMajorById(id);
  if (major._count.students > 0 || major.classes.length > 0) {
    throw new AppError(
      "Jurusan tidak dapat dihapus karena masih memiliki kelas/siswa terdaftar",
      409
    );
  }
  await prisma.major.delete({ where: { id } });
}
