import type { NextFunction, Request, Response } from "express";
import { createParentSchema, updateParentSchema } from "../schemas/parent.schema";
import * as parentService from "../services/parent.service";
import { created, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await parentService.listParents();
    return ok(res, data, "Daftar orang tua berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await parentService.getParentById(req.params.id);
    return ok(res, data, "Detail orang tua berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createParentSchema.parse(req.body);
    const data = await parentService.createParent(input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "Parent", entityId: data.parent!.id, ipAddress: req.ip },
    });
    return created(res, data, "Data orang tua berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateParentSchema.parse(req.body);
    const data = await parentService.updateParent(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "Parent", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Data orang tua berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await parentService.deleteParent(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Parent", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Data orang tua berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
