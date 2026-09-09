import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt";
import { fail } from "../utils/apiResponse";
import { UserRepository } from "../services/repositories";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return fail(res, "Token tidak ditemukan", 401);
    }

    const token = header.split(" ")[1];
    const payload = verifyToken(token);

    // Pastikan user masih aktif di database (tidak dinonaktifkan admin setelah token terbit).
    const user = UserRepository.findUnique(payload.userId);
    if (!user || !user.isActive) {
      return fail(res, "Akun tidak aktif atau tidak ditemukan", 401);
    }

    req.user = payload;
    next();
  } catch {
    return fail(res, "Token tidak valid atau kedaluwarsa", 401);
  }
}
