import type { NextFunction, Request, Response } from "express";
import { createTeacherSchema, updateTeacherSchema } from "../schemas/teacher.schema";
import * as teacherService from "../services/teacher.service";
import { created, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await teacherService.listTeachers();
    return ok(res, data, "Daftar guru berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await teacherService.getTeacherById(req.params.id);
    return ok(res, data, "Detail guru berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTeacherSchema.parse(req.body);
    const data = await teacherService.createTeacher(input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "Teacher", entityId: data.teacher!.id, ipAddress: req.ip },
    });
    return created(res, data, "Guru berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTeacherSchema.parse(req.body);
    const data = await teacherService.updateTeacher(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "Teacher", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Guru berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await teacherService.deleteTeacher(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Teacher", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Guru berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
