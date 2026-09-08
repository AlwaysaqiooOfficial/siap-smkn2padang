import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { hashPassword } from "../utils/password";
import type { CreateParentInput, UpdateParentInput } from "../schemas/parent.schema";

const includeDefault = {
  user: { select: { id: true, email: true, username: true, isActive: true, lastLoginAt: true } },
  students: { select: { id: true, fullName: true, nis: true, class: { select: { name: true } } } },
};

export async function listParents() {
  return prisma.parent.findMany({ include: includeDefault, orderBy: { fullName: "asc" } });
}

export async function getParentById(id: string) {
  const parent = await prisma.parent.findUnique({ where: { id }, include: includeDefault });
  if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
  return parent;
}

export async function createParent(input: CreateParentInput) {
  const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
  if (emailTaken) throw new AppError("Email sudah digunakan", 409);

  const usernameTaken = await prisma.user.findUnique({ where: { username: input.username } });
  if (usernameTaken) throw new AppError("Username sudah digunakan", 409);

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      role: "ORANG_TUA",
      parent: {
        create: {
          fullName: input.fullName,
          phone: input.phone,
          address: input.address,
        },
      },
    },
    include: { parent: true },
  });
}

export async function updateParent(id: string, input: UpdateParentInput) {
  const parent = await getParentById(id);

  if (input.email) {
    const taken = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: parent.user.id } } });
    if (taken) throw new AppError("Email sudah digunakan", 409);
  }
  if (input.username) {
    const taken = await prisma.user.findFirst({ where: { username: input.username, NOT: { id: parent.user.id } } });
    if (taken) throw new AppError("Username sudah digunakan", 409);
  }

  const userData: Record<string, unknown> = {};
  if (input.email) userData.email = input.email;
  if (input.username) userData.username = input.username;
  if (typeof input.isActive === "boolean") userData.isActive = input.isActive;
  if (input.password) userData.passwordHash = await hashPassword(input.password);

  const parentData: Record<string, unknown> = {};
  if (input.fullName) parentData.fullName = input.fullName;
  if (input.phone) parentData.phone = input.phone;
  if (input.address) parentData.address = input.address;

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id: parent.user.id }, data: userData });
  }
  return prisma.parent.update({ where: { id }, data: parentData, include: includeDefault });
}

export async function deleteParent(id: string) {
  const parent = await getParentById(id);
  if (parent.students.length > 0) {
    throw new AppError(
      "Data orang tua tidak dapat dihapus karena masih terhubung dengan data siswa",
      409
    );
  }
  await prisma.user.delete({ where: { id: parent.user.id } });
}
