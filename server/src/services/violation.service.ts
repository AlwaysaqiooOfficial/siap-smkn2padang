import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly, getViolationNotifyThreshold } from "../utils/schoolSettings";
import { sendViolationEmail } from "./email.service";
import type { CreateViolationInput, ListViolationInput, UpdateViolationInput } from "../schemas/violation.schema";
import { ClassRepository, MajorRepository, StudentRepository, TeacherRepository, ViolationCategoryRepository, ViolationRepository } from "./repositories";

export interface ListViolationScope { classId?: string; teacherId?: string; }

function view(item: any) {
  const student = StudentRepository.findUnique(item.studentId);
  const category = ViolationCategoryRepository.findUnique(item.categoryId ?? item.violationCategoryId);
  const schoolClass = student ? ClassRepository.findUnique(student.classId) : undefined;
  const major = student ? MajorRepository.findUnique(student.majorId) : undefined;
  const teacher = item.teacherId ? TeacherRepository.findUnique(item.teacherId) : undefined;
  return {
    ...item,
    points: item.points ?? item.point,
    date: new Date(item.date),
    student: student ? { ...student, class: schoolClass ? { id: schoolClass.id, name: schoolClass.name } : null, major: major ? { code: major.code, name: major.name } : null } : null,
    teacher: teacher ? { id: teacher.id, fullName: teacher.fullName } : null,
    category,
  };
}

export function listViolations(filter: ListViolationInput, scope: ListViolationScope) {
  if (scope.classId && filter.classId && filter.classId !== scope.classId) throw new AppError("Anda tidak memiliki akses ke kelas di luar kelas Anda", 403);
  let records = ViolationRepository.findMany();
  if (filter.studentId) records = records.filter((item) => item.studentId === filter.studentId);
  if (filter.categoryId) records = records.filter((item) => (item.categoryId ?? item.violationCategoryId) === filter.categoryId);
  if (filter.status) records = records.filter((item) => item.status === filter.status);
  if (scope.teacherId) records = records.filter((item) => item.teacherId === scope.teacherId);
  const classId = scope.classId ?? filter.classId;
  if (classId) records = records.filter((item) => StudentRepository.findUnique(item.studentId)?.classId === classId);
  records.sort((a, b) => b.date.localeCompare(a.date));
  const total = records.length;
  const start = (filter.page - 1) * filter.limit;
  return { data: records.slice(start, start + filter.limit).map(view), meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) || 1 } };
}

export function getViolationById(id: string) {
  const item = ViolationRepository.findUnique(id);
  if (!item) throw new AppError("Data pelanggaran tidak ditemukan", 404);
  return view(item);
}

function assertAccess(item: any, scope: ListViolationScope) {
  const student = StudentRepository.findUnique(item.studentId);
  if (scope.classId && student?.classId !== scope.classId) throw new AppError("Anda tidak memiliki akses ke pelanggaran ini", 403);
  if (scope.teacherId && item.teacherId !== scope.teacherId) throw new AppError("Anda hanya dapat mengakses laporan yang Anda buat sendiri", 403);
}

export async function createViolation(input: CreateViolationInput, teacherId: string) {
  const student = StudentRepository.findUnique(input.studentId);
  const category = ViolationCategoryRepository.findUnique(input.categoryId);
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (!student.isActive) throw new AppError("Siswa berstatus tidak aktif", 403);
  if (!category) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);
  const points = input.points ?? category.points;
  const created = await ViolationRepository.create({
    id: crypto.randomUUID(), studentId: input.studentId, teacherId, categoryId: input.categoryId, violationCategoryId: input.categoryId,
    description: input.description ?? "", date: serverDateOnly(input.date).toISOString(), points, point: points, status: "REPORTED",
    semesterId: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  const result: any = view(created);
  if (points >= await getViolationNotifyThreshold()) {
    void sendViolationEmail({ studentId: student.id, studentName: student.fullName, className: result.student.class?.name ?? "-", majorName: result.student.major?.name ?? "-", categoryName: category.name, points, date: new Date(created.date), description: created.description, violationId: created.id });
  }
  return result;
}

export async function updateViolation(id: string, input: UpdateViolationInput, scope: ListViolationScope) {
  const existing: any = getViolationById(id);
  assertAccess(existing, scope);
  if (scope.teacherId && existing.status !== "REPORTED") throw new AppError("Laporan yang sudah ditinjau tidak dapat diubah oleh pelapor", 409);
  if (input.categoryId && !ViolationCategoryRepository.findUnique(input.categoryId)) throw new AppError("Kategori pelanggaran tidak ditemukan", 404);
  const updates: any = { ...input };
  if (input.categoryId) { updates.violationCategoryId = input.categoryId; }
  if (input.points !== undefined) updates.point = input.points;
  const updated = await ViolationRepository.update(id, updates);
  return view(updated);
}

export async function deleteViolation(id: string) {
  getViolationById(id);
  await ViolationRepository.delete(id);
}
