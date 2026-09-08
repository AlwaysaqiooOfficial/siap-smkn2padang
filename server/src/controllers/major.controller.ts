import type { NextFunction, Request, Response } from "express";
import { createMajorSchema, updateMajorSchema } from "../schemas/major.schema";
import * as majorService from "../services/major.service";
import { created, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await majorService.listMajors();
    return ok(res, data, "Daftar jurusan berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await majorService.getMajorById(req.params.id);
    return ok(res, data, "Detail jurusan berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createMajorSchema.parse(req.body);
    const data = await majorService.createMajor(input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "Major", entityId: data.id, ipAddress: req.ip },
    });
    return created(res, data, "Jurusan berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateMajorSchema.parse(req.body);
    const data = await majorService.updateMajor(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "Major", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Jurusan berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await majorService.deleteMajor(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Major", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Jurusan berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
