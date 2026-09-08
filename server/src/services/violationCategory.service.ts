import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import type {
  CreateViolationCategoryInput,
  UpdateViolationCategoryInput,
} from "../schemas/violationCategory.schema";

export async function listViolationCategories() {
  return prisma.violationCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { violations: true } } },
  });
}

export async function getViolationCategoryById(id: string) {
  const category = await prisma.violationCategory.findUnique({
    where: { id },
    include: { _count: { select: { violations: true } } },
  });
  if (!category) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);
  return category;
}

export async function createViolationCategory(input: CreateViolationCategoryInput) {
  const exists = await prisma.violationCategory.findUnique({ where: { name: input.name } });
  if (exists) throw new AppError("Nama kategori pelanggaran sudah digunakan", 409);
  return prisma.violationCategory.create({ data: input });
}

/** Admin dapat mengubah poin kategori kapan saja — sesuai spesifikasi "sistem poin dapat dikonfigurasi". */
export async function updateViolationCategory(id: string, input: UpdateViolationCategoryInput) {
  await getViolationCategoryById(id);
  if (input.name) {
    const taken = await prisma.violationCategory.findFirst({ where: { name: input.name, NOT: { id } } });
    if (taken) throw new AppError("Nama kategori pelanggaran sudah digunakan", 409);
  }
  return prisma.violationCategory.update({ where: { id }, data: input });
}

export async function deleteViolationCategory(id: string) {
  const category = await getViolationCategoryById(id);
  if (category._count.violations > 0) {
    throw new AppError(
      "Kategori tidak dapat dihapus karena masih dipakai oleh data pelanggaran",
      409
    );
  }
  await prisma.violationCategory.delete({ where: { id } });
}
