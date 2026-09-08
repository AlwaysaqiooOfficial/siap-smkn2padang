import type { NextFunction, Request, Response } from "express";
import {
  createViolationCategorySchema,
  updateViolationCategorySchema,
} from "../schemas/violationCategory.schema";
import * as categoryService from "../services/violationCategory.service";
import { created, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.listViolationCategories();
    return ok(res, data, "Daftar kategori pelanggaran berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.getViolationCategoryById(req.params.id);
    return ok(res, data, "Detail kategori pelanggaran berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createViolationCategorySchema.parse(req.body);
    const data = await categoryService.createViolationCategory(input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "ViolationCategory", entityId: data.id, ipAddress: req.ip },
    });
    return created(res, data, "Kategori pelanggaran berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateViolationCategorySchema.parse(req.body);
    const data = await categoryService.updateViolationCategory(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "ViolationCategory", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Kategori pelanggaran berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteViolationCategory(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "ViolationCategory", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Kategori pelanggaran berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
