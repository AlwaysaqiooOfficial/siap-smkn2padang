import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly, getViolationNotifyThreshold } from "../utils/schoolSettings";
import { sendViolationEmail } from "./email.service";
import type {
  CreateViolationInput,
  ListViolationInput,
  UpdateViolationInput,
} from "../schemas/violation.schema";

const includeDefault = {
  student: {
    select: {
      id: true,
      fullName: true,
      nis: true,
      classId: true,
      class: { select: { id: true, name: true } },
      major: { select: { code: true, name: true } },
    },
  },
  teacher: { select: { id: true, fullName: true } },
  category: { select: { id: true, name: true, points: true } },
};

export interface ListViolationScope {
  classId?: string; // paksa scope WALI_KELAS
  teacherId?: string; // paksa scope GURU (hanya laporan miliknya sendiri)
}

export async function listViolations(filter: ListViolationInput, scope: ListViolationScope) {
  if (scope.classId && filter.classId && filter.classId !== scope.classId) {
    throw new AppError("Anda tidak memiliki akses ke kelas di luar kelas Anda", 403);
  }

  const where = {
    studentId: filter.studentId,
    categoryId: filter.categoryId,
    status: filter.status,
    teacherId: scope.teacherId,
    student: {
      classId: scope.classId ?? filter.classId,
    },
  };

  const [data, total] = await Promise.all([
    prisma.violation.findMany({
      where,
      include: includeDefault,
      orderBy: { date: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.violation.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.ceil(total / filter.limit) || 1,
    },
  };
}

export async function getViolationById(id: string) {
  const violation = await prisma.violation.findUnique({ where: { id }, include: includeDefault });
  if (!violation) throw new AppError("Data pelanggaran tidak ditemukan", 404);
  return violation;
}

function assertAccess(
  violation: { student: { classId: string }; teacherId: string },
  scope: ListViolationScope
) {
  if (scope.classId && violation.student.classId !== scope.classId) {
    throw new AppError("Anda tidak memiliki akses ke pelanggaran ini", 403);
  }
  if (scope.teacherId && violation.teacherId !== scope.teacherId) {
    throw new AppError("Anda hanya dapat mengakses laporan yang Anda buat sendiri", 403);
  }
}

export async function createViolation(input: CreateViolationInput, teacherId: string) {
  const [student, category] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.violationCategory.findUnique({ where: { id: input.categoryId } }),
  ]);

  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (!student.isActive) throw new AppError("Siswa berstatus tidak aktif", 403);
  if (!category) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);

  const points = input.points ?? category.points;
  const date = serverDateOnly(input.date);

  const violation = await prisma.violation.create({
    data: {
      studentId: input.studentId,
      teacherId,
      categoryId: input.categoryId,
      description: input.description,
      date,
      points,
      status: "REPORTED",
    },
    include: includeDefault,
  });

  // "Pelanggaran tertentu" -> email hanya dikirim jika poin >= ambang batas (school_settings).
  const threshold = await getViolationNotifyThreshold();
  if (points >= threshold) {
    void sendViolationEmail({
      studentId: violation.studentId,
      studentName: violation.student.fullName,
      className: violation.student.class.name,
      majorName: violation.student.major.name,
      categoryName: violation.category.name,
      points: violation.points,
      date: violation.date,
      description: violation.description ?? undefined,
      violationId: violation.id,
    });
  }

  return violation;
}

export async function updateViolation(
  id: string,
  input: UpdateViolationInput,
  scope: ListViolationScope
) {
  const violation = await getViolationById(id);
  assertAccess(violation, scope);

  // GURU hanya boleh mengedit laporannya sendiri SELAGI masih berstatus REPORTED (belum ditinjau).
  if (scope.teacherId && violation.status !== "REPORTED") {
    throw new AppError("Laporan yang sudah ditinjau tidak dapat diubah oleh pelapor", 409);
  }

  if (input.categoryId) {
    const category = await prisma.violationCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);
  }

  const updated = await prisma.violation.update({
    where: { id },
    data: input,
    include: includeDefault,
  });

  return updated;
}

export async function deleteViolation(id: string) {
  await getViolationById(id);
  await prisma.violation.delete({ where: { id } });
}
