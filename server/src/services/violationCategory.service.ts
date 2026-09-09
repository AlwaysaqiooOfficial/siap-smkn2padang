import { AppError } from "../middlewares/error.middleware";
import type { CreateViolationCategoryInput, UpdateViolationCategoryInput } from "../schemas/violationCategory.schema";
import { ViolationCategoryRepository, ViolationRepository } from "./repositories";

export function listViolationCategories() {
  return ViolationCategoryRepository.findMany()
    .map((category) => ({
      ...category,
      _count: { violations: ViolationRepository.count((item) => item.violationCategoryId === category.id) },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getViolationCategoryById(id: string) {
  const category = ViolationCategoryRepository.findUnique(id);
  if (!category) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);
  return {
    ...category,
    _count: { violations: ViolationRepository.count((item) => item.violationCategoryId === id) },
  };
}

export async function createViolationCategory(input: CreateViolationCategoryInput) {
  if (ViolationCategoryRepository.findFirst((item) => item.name === input.name)) {
    throw new AppError("Nama kategori pelanggaran sudah digunakan", 409);
  }
  return ViolationCategoryRepository.create({
    id: crypto.randomUUID(),
    ...input,
    description: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateViolationCategory(id: string, input: UpdateViolationCategoryInput) {
  getViolationCategoryById(id);
  if (input.name && ViolationCategoryRepository.findFirst((item) => item.name === input.name && item.id !== id)) {
    throw new AppError("Nama kategori pelanggaran sudah digunakan", 409);
  }
  await ViolationCategoryRepository.update(id, input);
  return getViolationCategoryById(id);
}

export async function deleteViolationCategory(id: string) {
  const category = getViolationCategoryById(id);
  if (category._count.violations > 0) {
    throw new AppError("Kategori tidak dapat dihapus karena masih dipakai oleh data pelanggaran", 409);
  }
  await ViolationCategoryRepository.delete(id);
}
