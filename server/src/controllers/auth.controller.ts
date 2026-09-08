import type { NextFunction, Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema";
import { getMeService, loginService } from "../services/auth.service";
import { ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginService(input, req.ip);
    return ok(res, result, "Login berhasil");
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMeService(req.user!.userId);
    return ok(res, user, "Berhasil mengambil profil");
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: req.user!.userId,
        ipAddress: req.ip,
      },
    });
    // Stateless JWT: logout ditangani di sisi client dengan menghapus token.
    return ok(res, null, "Logout berhasil");
  } catch (err) {
    next(err);
  }
}
