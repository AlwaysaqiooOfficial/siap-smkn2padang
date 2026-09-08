import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../middlewares/error.middleware";
import type { LoginInput } from "../schemas/auth.schema";
import { UserRepository, TeacherRepository } from "./repositories";

export async function loginService(input: LoginInput, ipAddress?: string) {
  const user = UserRepository.findFirst((u) => 
    u.email === input.identifier || u.username === input.identifier
  );

  if (!user || !user.isActive) {
    throw new AppError("Email/username atau password salah", 401);
  }

  if (!["SUPER_ADMIN", "GURU", "WALI_KELAS", "SCANNER"].includes(user.role)) {
    throw new AppError("Hanya akun admin dan guru yang dapat masuk ke sistem", 403);
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError("Email/username atau password salah", 401);
  }

  let selectedTeacher = null;

  if (user.role === "GURU" || user.role === "WALI_KELAS") {
    if (!input.teacherName) {
      return { requiresTeacherName: true as const };
    }
    const inputNameClean = input.teacherName.trim().replace(/\.$/, "").toLowerCase();
    const allTeachers = TeacherRepository.findMany();

    selectedTeacher = allTeachers.find(
      (t) => t.fullName.trim().replace(/\.$/, "").toLowerCase() === inputNameClean
    );

    if (!selectedTeacher) {
      throw new AppError("Nama guru tidak ditemukan di database", 401);
    }
    if (!selectedTeacher.userId) {
      throw new AppError("Guru tersebut belum ditugaskan sebagai wali kelas", 403);
    }
  }

  const role = user.role === "WALI_KELAS" ? "GURU" : user.role;
  const token = signToken({ userId: user.id, role, teacherId: selectedTeacher?.id });

  // Update last login
  await UserRepository.update(user.id, { lastLoginAt: new Date().toISOString() });

  const profile = selectedTeacher || { fullName: user.username };

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
  const user = UserRepository.findUnique(userId);

  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
