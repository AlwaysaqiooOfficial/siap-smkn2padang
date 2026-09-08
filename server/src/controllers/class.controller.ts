import type { NextFunction, Request, Response } from "express";
import { createClassSchema, updateClassSchema } from "../schemas/class.schema";
import * as classService from "../services/class.service";
import { getHomeroomClassId } from "../services/homeroom.helper";
import { created, fail, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Guru/wali kelas hanya melihat kelas yang ditugaskan kepadanya.
    if (req.user!.role === "WALI_KELAS" || req.user!.role === "GURU") {
      const classId = await getHomeroomClassId(req.user!.userId, req.user!.teacherId);
      const data = await classService.getClassById(classId);
      return ok(res, [data], "Daftar kelas berhasil diambil");
    }

    const majorId = typeof req.query.majorId === "string" ? req.query.majorId : undefined;
    const data = await classService.listClasses({ majorId });
    return ok(res, data, "Daftar kelas berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user!.role === "WALI_KELAS" || req.user!.role === "GURU") {
      const classId = await getHomeroomClassId(req.user!.userId, req.user!.teacherId);
      if (classId !== req.params.id) {
        return fail(res, "Anda tidak memiliki akses ke kelas ini", 403);
      }
    }
    const data = await classService.getClassById(req.params.id);
    return ok(res, data, "Detail kelas berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createClassSchema.parse(req.body);
    const data = await classService.createClass(input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "Class", entityId: data.id, ipAddress: req.ip },
    });
    return created(res, data, "Kelas berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateClassSchema.parse(req.body);
    const data = await classService.updateClass(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "Class", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Kelas berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await classService.deleteClass(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Class", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Kelas berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
