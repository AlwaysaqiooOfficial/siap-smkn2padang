import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly } from "../utils/schoolSettings";
import { notifyParentOfStudent } from "./notification.service";
import { sendPermissionApprovedEmail } from "./email.service";
import type {
  CreatePermissionInput,
  ListPermissionInput,
  ReviewPermissionInput,
} from "../schemas/permission.schema";

const includeDefault = {
  student: {
    select: {
      id: true,
      fullName: true,
      nis: true,
      classId: true,
      class: { select: { id: true, name: true } },
      major: { select: { name: true } },
    },
  },
};

export async function listPermissions(filter: ListPermissionInput, scopedClassId?: string) {
  const where = {
    status: filter.status,
    studentId: filter.studentId,
    student: {
      classId: scopedClassId ?? filter.classId,
    },
  };

  const [data, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      include: includeDefault,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.permission.count({ where }),
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

export async function getPermissionById(id: string) {
  const permission = await prisma.permission.findUnique({ where: { id }, include: includeDefault });
  if (!permission) throw new AppError("Pengajuan izin/sakit/dispensasi tidak ditemukan", 404);
  return permission;
}

function assertScope(classId: string, scopedClassId?: string) {
  if (scopedClassId && classId !== scopedClassId) {
    throw new AppError("Anda tidak memiliki akses ke siswa di luar kelas Anda", 403);
  }
}

export async function createPermission(input: CreatePermissionInput, scopedClassId?: string) {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, isActive: true, classId: true },
  });
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (!student.isActive) throw new AppError("Siswa berstatus tidak aktif", 403);

  assertScope(student.classId, scopedClassId);

  const date = serverDateOnly(input.date);

  const duplicate = await prisma.permission.findFirst({
    where: { studentId: input.studentId, date, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (duplicate) {
    throw new AppError(
      "Sudah ada pengajuan izin/sakit/dispensasi (pending/approved) untuk siswa ini pada tanggal tersebut",
      409
    );
  }

  return prisma.permission.create({
    data: {
      studentId: input.studentId,
      type: input.type,
      reason: input.reason,
      date,
      attachment: input.attachment,
      status: "PENDING",
    },
    include: includeDefault,
  });
}

async function applyApprovedAttendance(permission: {
  id: string;
  studentId: string;
  type: "IZIN" | "SAKIT" | "DISPENSASI";
  date: Date;
}) {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!activeSemester) {
    throw new AppError("Tidak ada semester aktif. Hubungi admin untuk mengatur semester.", 500);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.attendance.findUnique({
      where: {
        studentId_date_semesterId: {
          studentId: permission.studentId,
          date: permission.date,
          semesterId: activeSemester.id,
        },
      },
    });

    let attendance;
    if (existing) {
      // Menimpa status apa pun sebelumnya (termasuk ALFA hasil auto-alfa) dengan status izin/sakit/dispensasi.
      attendance = await tx.attendance.update({
        where: { id: existing.id },
        data: { status: permission.type, permissionId: permission.id },
      });
      await tx.attendanceLog.create({
        data: {
          attendanceId: attendance.id,
          action: "PERMISSION_APPLIED",
          note: `Status attendance diperbarui menjadi ${permission.type} setelah izin disetujui (sebelumnya: ${existing.status})`,
        },
      });
    } else {
      attendance = await tx.attendance.create({
        data: {
          studentId: permission.studentId,
          semesterId: activeSemester.id,
          date: permission.date,
          status: permission.type,
          permissionId: permission.id,
        },
      });
      await tx.attendanceLog.create({
        data: {
          attendanceId: attendance.id,
          action: "PERMISSION_APPLIED",
          note: `Attendance dibuat dengan status ${permission.type} dari izin yang disetujui`,
        },
      });
    }

    return attendance;
  });
}

export async function approvePermission(
  id: string,
  reviewerUserId: string,
  input: ReviewPermissionInput,
  scopedClassId?: string
) {
  const permission = await getPermissionById(id);
  assertScope(permission.student.classId, scopedClassId);

  if (permission.status !== "PENDING") {
    throw new AppError(`Pengajuan ini sudah berstatus ${permission.status}`, 409);
  }

  const updated = await prisma.permission.update({
    where: { id },
    data: { status: "APPROVED", reviewedBy: reviewerUserId, reviewedAt: new Date() },
    include: includeDefault,
  });

  // Approved permission mencegah/menimpa status ALFA — attendance disesuaikan otomatis.
  await applyApprovedAttendance({
    id: updated.id,
    studentId: updated.studentId,
    type: updated.type as "IZIN" | "SAKIT" | "DISPENSASI",
    date: updated.date,
  });

  await prisma.activityLog.create({
    data: {
      userId: reviewerUserId,
      action: "APPROVE_PERMISSION",
      entity: "Permission",
      entityId: id,
      metadata: { from: "PENDING", to: "APPROVED", note: input.note },
    },
  });

  await notifyParentOfStudent(
    updated.studentId,
    "Pengajuan Izin Disetujui",
    `Pengajuan ${updated.type} untuk ${updated.student.fullName} pada ${updated.date.toLocaleDateString("id-ID")} telah disetujui wali kelas.`
  );

  // Email hanya untuk IZIN & SAKIT (sesuai daftar event Phase 5) — DISPENSASI cukup notifikasi in-app.
  if (updated.type === "IZIN" || updated.type === "SAKIT") {
    void sendPermissionApprovedEmail({
      studentId: updated.studentId,
      studentName: updated.student.fullName,
      className: updated.student.class.name,
      majorName: updated.student.major.name,
      type: updated.type,
      date: updated.date,
      reason: updated.reason,
      permissionId: updated.id,
    });
  }

  return updated;
}

export async function rejectPermission(
  id: string,
  reviewerUserId: string,
  input: ReviewPermissionInput,
  scopedClassId?: string
) {
  const permission = await getPermissionById(id);
  assertScope(permission.student.classId, scopedClassId);

  if (permission.status !== "PENDING") {
    throw new AppError(`Pengajuan ini sudah berstatus ${permission.status}`, 409);
  }

  const updated = await prisma.permission.update({
    where: { id },
    data: { status: "REJECTED", reviewedBy: reviewerUserId, reviewedAt: new Date() },
    include: includeDefault,
  });

  await prisma.activityLog.create({
    data: {
      userId: reviewerUserId,
      action: "REJECT_PERMISSION",
      entity: "Permission",
      entityId: id,
      metadata: { from: "PENDING", to: "REJECTED", note: input.note },
    },
  });

  await notifyParentOfStudent(
    updated.studentId,
    "Pengajuan Izin Ditolak",
    `Pengajuan ${updated.type} untuk ${updated.student.fullName} pada ${updated.date.toLocaleDateString("id-ID")} ditolak oleh wali kelas.${input.note ? ` Catatan: ${input.note}` : ""}`
  );

  return updated;
}
