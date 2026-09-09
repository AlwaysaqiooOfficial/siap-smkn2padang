import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly } from "../utils/schoolSettings";
import { notifyParentOfStudent } from "./notification.service";
import { sendPermissionApprovedEmail } from "./email.service";
import type { CreatePermissionInput, ListPermissionInput, ReviewPermissionInput } from "../schemas/permission.schema";
import { AttendanceRepository, ClassRepository, MajorRepository, PermissionRepository, SemesterRepository, StudentRepository } from "./repositories";

function withStudent(permission: any) {
  const student = StudentRepository.findUnique(permission.studentId);
  if (!student) return permission;
  const schoolClass = ClassRepository.findUnique(student.classId);
  const major = MajorRepository.findUnique(student.majorId);
  return {
    ...permission,
    date: new Date(permission.date),
    student: {
      ...student,
      class: schoolClass ? { id: schoolClass.id, name: schoolClass.name } : null,
      major: major ? { name: major.name } : null,
    },
  };
}

export function listPermissions(filter: ListPermissionInput, scopedClassId?: string) {
  let records = PermissionRepository.findMany();
  if (filter.status) records = records.filter((item) => item.status === filter.status);
  if (filter.studentId) records = records.filter((item) => item.studentId === filter.studentId);
  const classId = scopedClassId ?? filter.classId;
  if (classId) records = records.filter((item) => StudentRepository.findUnique(item.studentId)?.classId === classId);
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = records.length;
  const start = (filter.page - 1) * filter.limit;
  return {
    data: records.slice(start, start + filter.limit).map(withStudent),
    meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) || 1 },
  };
}

export function getPermissionById(id: string) {
  const permission = PermissionRepository.findUnique(id);
  if (!permission) throw new AppError("Pengajuan izin/sakit/dispensasi tidak ditemukan", 404);
  return withStudent(permission);
}

function assertScope(classId: string, scopedClassId?: string) {
  if (scopedClassId && classId !== scopedClassId) throw new AppError("Anda tidak memiliki akses ke siswa di luar kelas Anda", 403);
}

export async function createPermission(input: CreatePermissionInput, scopedClassId?: string) {
  const student = StudentRepository.findUnique(input.studentId);
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (!student.isActive) throw new AppError("Siswa berstatus tidak aktif", 403);
  assertScope(student.classId, scopedClassId);
  const date = serverDateOnly(input.date).toISOString();
  const duplicate = PermissionRepository.findFirst((item) => item.studentId === input.studentId && item.date === date && ["PENDING", "APPROVED"].includes(item.status));
  if (duplicate) throw new AppError("Sudah ada pengajuan untuk siswa ini pada tanggal tersebut", 409);
  const created = await PermissionRepository.create({
    id: crypto.randomUUID(),
    studentId: input.studentId,
    type: input.type,
    reason: input.reason,
    date,
    attachment: input.attachment,
    status: "PENDING",
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return withStudent(created);
}

async function applyApprovedAttendance(permission: any) {
  const semester = SemesterRepository.findFirst((item) => item.isActive);
  if (!semester) throw new AppError("Tidak ada semester aktif. Hubungi admin untuk mengatur semester.", 500);
  const existing = AttendanceRepository.findFirst((item) => item.studentId === permission.studentId && item.date === permission.date && item.semesterId === semester.id);
  if (existing) {
    return AttendanceRepository.update(existing.id, { status: permission.type, permissionId: permission.id });
  }
  return AttendanceRepository.create({
    id: crypto.randomUUID(),
    studentId: permission.studentId,
    semesterId: semester.id,
    date: permission.date,
    checkInTime: null,
    status: permission.type,
    permissionId: permission.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function approvePermission(id: string, reviewerUserId: string, input: ReviewPermissionInput, scopedClassId?: string) {
  const permission: any = getPermissionById(id);
  assertScope(permission.student.classId, scopedClassId);
  if (permission.status !== "PENDING") throw new AppError(`Pengajuan ini sudah berstatus ${permission.status}`, 409);
  const updated = await PermissionRepository.update(id, { status: "APPROVED", reviewedBy: reviewerUserId, reviewedAt: new Date().toISOString(), approvedBy: reviewerUserId, approvedAt: new Date().toISOString(), note: input.note });
  await applyApprovedAttendance(updated);
  await notifyParentOfStudent(updated.studentId, "Pengajuan Izin Disetujui", `Pengajuan ${updated.type} untuk ${permission.student.fullName} telah disetujui wali kelas.`);
  if (updated.type === "IZIN" || updated.type === "SAKIT") {
    void sendPermissionApprovedEmail({ studentId: updated.studentId, studentName: permission.student.fullName, className: permission.student.class?.name ?? "-", majorName: permission.student.major?.name ?? "-", type: updated.type, date: new Date(updated.date), reason: updated.reason, permissionId: updated.id });
  }
  return withStudent(updated);
}

export async function rejectPermission(id: string, reviewerUserId: string, input: ReviewPermissionInput, scopedClassId?: string) {
  const permission: any = getPermissionById(id);
  assertScope(permission.student.classId, scopedClassId);
  if (permission.status !== "PENDING") throw new AppError(`Pengajuan ini sudah berstatus ${permission.status}`, 409);
  const updated = await PermissionRepository.update(id, { status: "REJECTED", reviewedBy: reviewerUserId, reviewedAt: new Date().toISOString(), note: input.note });
  await notifyParentOfStudent(updated.studentId, "Pengajuan Izin Ditolak", `Pengajuan ${updated.type} untuk ${permission.student.fullName} ditolak oleh wali kelas.${input.note ? ` Catatan: ${input.note}` : ""}`);
  return withStudent(updated);
}
