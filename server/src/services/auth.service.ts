import { prisma } from "../config/db";
import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../middlewares/error.middleware";
import type { LoginInput } from "../schemas/auth.schema";

export async function loginService(input: LoginInput, ipAddress?: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.identifier }, { username: input.identifier }],
    },
    include: {
      teacher: true,
      parent: true,
      student: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("Email/username atau password salah", 401);
  }

  if (!["SUPER_ADMIN", "GURU", "WALI_KELAS", "SCANNER"].includes(user.role)) {
    throw new AppError("Hanya akun admin dan guru yang dapat masuk ke sistem", 403);
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress,
        metadata: { success: false },
      },
    });
    throw new AppError("Email/username atau password salah", 401);
  }

  if (user.role === "GURU" || user.role === "WALI_KELAS") {
    if (!input.teacherName) {
      return { requiresTeacherName: true as const };
    }
    const selectedTeacher = await prisma.teacher.findFirst({
      where: { fullName: { equals: input.teacherName.trim() } },
      include: { homeroomClass: true },
    });
    if (!selectedTeacher) {
      throw new AppError("Nama guru tidak ditemukan di database", 401);
    }
    if (!selectedTeacher.homeroomClass) {
      throw new AppError("Guru tersebut belum ditugaskan sebagai wali kelas", 403);
    }
    if (user.teacher && user.teacher.fullName.trim().toLowerCase() !== input.teacherName.trim().toLowerCase()) {
      throw new AppError("Nama guru tidak sesuai dengan akun dan password tersebut", 401);
    }
    user.teacher = selectedTeacher;
  }

  const role = user.role === "WALI_KELAS" ? "GURU" : user.role;
  const token = signToken({ userId: user.id, role, teacherId: user.teacher?.id });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress,
        metadata: { success: true },
      },
    }),
  ]);

  const profile =
    user.teacher ?? user.parent ?? user.student ?? { fullName: user.username };

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role,
      fullName: "fullName" in profile ? profile.fullName : user.username,
    },
  };
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true, parent: true, student: { include: { class: true, major: true } } },
  });

  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
