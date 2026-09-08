import type { NextFunction, Request, Response } from "express";
import {
  createViolationSchema,
  listViolationSchema,
  updateViolationSchema,
} from "../schemas/violation.schema";
import * as violationService from "../services/violation.service";
import { getHomeroomClassId, getTeacherIdByUserId } from "../services/homeroom.helper";
import { created, fail, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

async function resolveScope(req: Request): Promise<violationService.ListViolationScope> {
  if (req.user!.role === "WALI_KELAS") {
    return { classId: await getHomeroomClassId(req.user!.userId) };
  }
  if (req.user!.role === "GURU") {
    return { teacherId: await getTeacherIdByUserId(req.user!.userId) };
  }
  return {}; // SUPER_ADMIN: tanpa batasan
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listViolationSchema.parse(req.query);
    const scope = await resolveScope(req);
    const { data, meta } = await violationService.listViolations(input, scope);
    return res.json({ success: true, message: "Daftar pelanggaran berhasil diambil", data, meta });
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await violationService.getViolationById(req.params.id);
    const scope = await resolveScope(req);
    if (scope.classId && data.student.classId !== scope.classId) {
      return fail(res, "Anda tidak memiliki akses ke data ini", 403);
    }
    if (scope.teacherId && data.teacher.id !== scope.teacherId) {
      return fail(res, "Anda tidak memiliki akses ke data ini", 403);
    }
    return ok(res, data, "Detail pelanggaran berhasil diambil");
  } catch (err) {
    next(err);
  }
}

/** Guru melapor atas nama dirinya sendiri; SUPER_ADMIN wajib menyertakan teacherId di body. */
async function resolveTeacherIdForCreate(req: Request): Promise<string | null> {
  if (req.user!.role === "GURU") {
    return getTeacherIdByUserId(req.user!.userId);
  }

  const bodyTeacherId = req.body?.teacherId;
  if (!bodyTeacherId || typeof bodyTeacherId !== "string") {
    return null;
  }
  const teacher = await prisma.teacher.findUnique({ where: { id: bodyTeacherId } });
  return teacher ? teacher.id : null;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createViolationSchema.parse(req.body);
    const teacherId = await resolveTeacherIdForCreate(req);

    if (!teacherId) {
      return fail(
        res,
        req.user!.role === "SUPER_ADMIN"
          ? "SUPER_ADMIN wajib menyertakan teacherId (id guru pelapor) yang valid di body"
          : "Akun ini tidak terdaftar sebagai guru",
        422
      );
    }

    const data = await violationService.createViolation(input, teacherId);

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: "CREATE_VIOLATION",
        entity: "Violation",
        entityId: data.id,
        ipAddress: req.ip,
        metadata: { studentId: input.studentId, points: data.points },
      },
    });

    return created(res, data, "Laporan pelanggaran berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateViolationSchema.parse(req.body);
    const scope = await resolveScope(req);
    const data = await violationService.updateViolation(req.params.id, input, scope);

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE",
        entity: "Violation",
        entityId: data.id,
        ipAddress: req.ip,
        metadata: { status: data.status },
      },
    });

    return ok(res, data, "Data pelanggaran berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await violationService.deleteViolation(req.params.id);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Violation", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Data pelanggaran berhasil dihapus");
  } catch (err) {
    next(err);
  }
}
