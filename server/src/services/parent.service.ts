import { AppError } from "../middlewares/error.middleware";
import { hashPassword } from "../utils/password";
import type { CreateParentInput, UpdateParentInput } from "../schemas/parent.schema";
import { ClassRepository, StudentRepository, UserRepository } from "./repositories";
import { findAll, findOne, transaction } from "./jsonDatabase";

function withStudents(parent: any) {
  return {
    ...parent,
    students: StudentRepository.findFilter((student) => student.parentId === parent.id).map((student) => ({ id: student.id, fullName: student.fullName, nis: student.nis, class: ClassRepository.findUnique(student.classId) ? { name: ClassRepository.findUnique(student.classId)!.name } : null })),
    user: parent.userId ? UserRepository.findUnique(parent.userId) : undefined,
  };
}

export function listParents() {
  return findAll<any>("parents").map(withStudents).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function getParentById(id: string) {
  const parent = findOne<any>("parents", id);
  if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
  return withStudents(parent);
}

export async function createParent(input: CreateParentInput) {
  if (UserRepository.findFirst((user) => user.email === input.email)) throw new AppError("Email sudah digunakan", 409);
  if (UserRepository.findFirst((user) => user.username === input.username)) throw new AppError("Username sudah digunakan", 409);
  const now = new Date().toISOString(); const userId = crypto.randomUUID(); const parentId = crypto.randomUUID();
  await UserRepository.create({ id: userId, email: input.email, username: input.username, passwordHash: await hashPassword(input.password), role: "ORANG_TUA", isActive: true, lastLoginAt: null, createdAt: now, updatedAt: now });
  await transaction(async (db) => db.create("parents", { id: parentId, userId, fullName: input.fullName, email: input.email, phone: input.phone ?? "", address: input.address ?? "", createdAt: now, updatedAt: now }));
  return getParentById(parentId);
}

export async function updateParent(id: string, input: UpdateParentInput) {
  const parent = getParentById(id); const user = parent.user;
  if (input.email && UserRepository.findFirst((item) => item.email === input.email && item.id !== user?.id)) throw new AppError("Email sudah digunakan", 409);
  if (input.username && UserRepository.findFirst((item) => item.username === input.username && item.id !== user?.id)) throw new AppError("Username sudah digunakan", 409);
  if (user) await UserRepository.update(user.id, { email: input.email ?? user.email, username: input.username ?? user.username, isActive: input.isActive ?? user.isActive, ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}) });
  const updates: any = {}; if (input.email !== undefined) updates.email = input.email; if (input.fullName !== undefined) updates.fullName = input.fullName; if (input.phone !== undefined) updates.phone = input.phone; if (input.address !== undefined) updates.address = input.address;
  if (Object.keys(updates).length) await transaction(async (db) => db.update("parents", id, updates));
  return getParentById(id);
}

export async function deleteParent(id: string) {
  const parent = getParentById(id); if (parent.students.length) throw new AppError("Data orang tua tidak dapat dihapus karena masih terhubung dengan data siswa", 409);
  if (parent.user?.id) await UserRepository.delete(parent.user.id);
  await transaction(async (db) => db.delete("parents", id));
}
