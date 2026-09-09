import { AppError } from "../middlewares/error.middleware";
import { hashPassword } from "../utils/password";
import { randomUUID } from "node:crypto";
import type { CreateTeacherInput, UpdateTeacherInput } from "../schemas/teacher.schema";
import { UserRepository, TeacherRepository, ClassRepository } from "./repositories";

export async function listTeachers() {
  const teachers = TeacherRepository.findMany();
  return teachers.map(teacher => {
    const user = teacher.userId ? UserRepository.findUnique(teacher.userId) : null;
    const homeroomClass = ClassRepository.findFirst(c => c.homeroomTeacherId === teacher.id);
    return {
      ...teacher,
      user: user ? { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt } : null,
      homeroomClass: homeroomClass ? { id: homeroomClass.id, name: homeroomClass.name } : null
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getTeacherById(id: string) {
  const teacher = TeacherRepository.findUnique(id);
  if (!teacher) throw new AppError("Guru tidak ditemukan", 404);
  
  const user = teacher.userId ? UserRepository.findUnique(teacher.userId) : null;
  const homeroomClass = ClassRepository.findFirst(c => c.homeroomTeacherId === id);
  
  return {
    ...teacher,
    user: user ? { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt } : null,
    homeroomClass: homeroomClass ? { id: homeroomClass.id, name: homeroomClass.name } : null
  };
}

export async function createTeacher(input: CreateTeacherInput) {
  if (input.nip) {
    const nipTaken = TeacherRepository.findFirst(t => t.nip === input.nip);
    if (nipTaken) throw new AppError("NIP sudah digunakan", 409);
  }

  const internalId = randomUUID().replaceAll("-", "");
  const email = input.email ?? `guru-${internalId}@internal.siap.local`;
  const username = `guru_${internalId}`;
  const passwordHash = await hashPassword(randomUUID());

  const emailTaken = UserRepository.findFirst(u => u.email === email);
  if (emailTaken) throw new AppError("Email sudah digunakan", 409);

  const userId = randomUUID();
  const teacherId = randomUUID();

  await UserRepository.create({
    id: userId,
    email,
    username,
    passwordHash,
    role: input.role,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const teacher = await TeacherRepository.create({
    id: teacherId,
    userId,
    fullName: input.fullName,
    nip: input.nip || "",
    phone: input.phone || "",
    isHomeroom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const user = UserRepository.findUnique(userId);
  return {
    ...teacher,
    user: { id: user!.id, email: user!.email, username: user!.username, role: user!.role, isActive: user!.isActive, lastLoginAt: user!.lastLoginAt }
  };
}

export async function updateTeacher(id: string, input: UpdateTeacherInput) {
  const teacher = await getTeacherById(id);

  if (input.email && teacher.user) {
    const taken = UserRepository.findFirst(u => u.email === input.email && u.id !== teacher.user!.id);
    if (taken) throw new AppError("Email sudah digunakan", 409);
  }
  if (input.nip) {
    const taken = TeacherRepository.findFirst(t => t.nip === input.nip && t.id !== id);
    if (taken) throw new AppError("NIP sudah digunakan", 409);
  }

  if (teacher.user && input.email) {
    await UserRepository.update(teacher.user.id, { email: input.email });
  }
  if (teacher.user && input.role) {
    await UserRepository.update(teacher.user.id, { role: input.role });
  }
  if (teacher.user && typeof input.isActive === "boolean") {
    await UserRepository.update(teacher.user.id, { isActive: input.isActive });
  }

  const updateData: any = {};
  if (input.fullName) updateData.fullName = input.fullName;
  if (input.nip) updateData.nip = input.nip;
  if (input.phone) updateData.phone = input.phone;
  if (input.role) updateData.isHomeroom = false;

  await TeacherRepository.update(id, updateData);
  return getTeacherById(id);
}

export async function deleteTeacher(id: string) {
  const teacher = await getTeacherById(id);
  if (teacher.homeroomClass) {
    throw new AppError(
      "Guru masih menjadi wali kelas aktif. Lepaskan penugasan wali kelas terlebih dahulu",
      409
    );
  }
  
  if (teacher.user) {
    await UserRepository.delete(teacher.user.id);
  }
  await TeacherRepository.delete(id);
}
