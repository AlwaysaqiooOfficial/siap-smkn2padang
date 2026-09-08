import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { fail } from "../utils/apiResponse";

/**
 * Middleware authorization berbasis role.
 * Contoh: router.get("/students", authenticate, authorize(["SUPER_ADMIN", "WALI_KELAS"]), handler)
 */
export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, "Belum terautentikasi", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, "Anda tidak memiliki akses untuk aksi ini", 403);
    }
    next();
  };
}
