import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { hashPassword } from "../utils/password";
import { randomUUID } from "node:crypto";
import type { CreateTeacherInput, UpdateTeacherInput } from "../schemas/teacher.schema";

const includeDefault = {
  user: { select: { id: true, email: true, username: true, role: true, isActive: true, lastLoginAt: true } },
  homeroomClass: { select: { id: true, name: true } },
};

export async function listTeachers() {
  return prisma.teacher.findMany({ include: includeDefault, orderBy: { fullName: "asc" } });
}

export async function getTeacherById(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id }, include: includeDefault });
  if (!teacher) throw new AppError("Guru tidak ditemukan", 404);
  return teacher;
}

export async function createTeacher(input: CreateTeacherInput) {
  if (input.nip) {
    const nipTaken = await prisma.teacher.findUnique({ where: { nip: input.nip } });
    if (nipTaken) throw new AppError("NIP sudah digunakan", 409);
  }

  const internalId = randomUUID().replaceAll("-", "");
  const email = input.email ?? `guru-${internalId}@internal.siap.local`;
  const username = `guru_${internalId}`;
  const passwordHash = await hashPassword(randomUUID());

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) throw new AppError("Email sudah digunakan", 409);

  return prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: input.role,
      teacher: {
        create: {
          fullName: input.fullName,
          nip: input.nip,
          phone: input.phone,
          isHomeroom: false,
        },
      },
    },
    include: { teacher: true },
  });
}

export async function updateTeacher(id: string, input: UpdateTeacherInput) {
  const teacher = await getTeacherById(id);

  if (input.email) {
    const taken = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: teacher.user.id } } });
    if (taken) throw new AppError("Email sudah digunakan", 409);
  }
  if (input.nip) {
    const taken = await prisma.teacher.findFirst({ where: { nip: input.nip, NOT: { id } } });
    if (taken) throw new AppError("NIP sudah digunakan", 409);
  }

  const userData: Record<string, unknown> = {};
  if (input.email) userData.email = input.email;
  if (input.role) userData.role = input.role;
  if (typeof input.isActive === "boolean") userData.isActive = input.isActive;

  const teacherData: Record<string, unknown> = {};
  if (input.fullName) teacherData.fullName = input.fullName;
  if (input.nip) teacherData.nip = input.nip;
  if (input.phone) teacherData.phone = input.phone;
  if (input.role) teacherData.isHomeroom = false;

  await prisma.user.update({ where: { id: teacher.user.id }, data: userData });
  return prisma.teacher.update({ where: { id }, data: teacherData, include: includeDefault });
}

export async function deleteTeacher(id: string) {
  const teacher = await getTeacherById(id);
  if (teacher.homeroomClass) {
    throw new AppError(
      "Guru masih menjadi wali kelas aktif. Lepaskan penugasan wali kelas terlebih dahulu",
      409
    );
  }
  // Cascade: User dihapus akan otomatis menghapus Teacher (onDelete: Cascade di schema).
  await prisma.user.delete({ where: { id: teacher.user.id } });
}
