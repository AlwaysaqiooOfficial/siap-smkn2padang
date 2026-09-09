import type { NextFunction, Request, Response } from "express";
import { listAttendanceSchema, scanAttendanceSchema } from "../schemas/attendance.schema";
import * as attendanceService from "../services/attendance.service";
import { getHomeroomClassId } from "../services/homeroom.helper";
import { ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

export async function scan(req: Request, res: Response, next: NextFunction) {
  try {
    const input = scanAttendanceSchema.parse(req.body);
    const result = await attendanceService.scanAttendance(input.token, req.user!.userId, req.ip);

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: "SCAN_ATTENDANCE",
        entity: "Attendance",
        entityId: result.student.id,
        ipAddress: req.ip,
        metadata: { status: result.status, duplicate: result.duplicate },
      },
    });

    return ok(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listAttendanceSchema.parse(req.query);
    const scopedClassId =
      req.user!.role === "WALI_KELAS" || req.user!.role === "GURU"
        ? await getHomeroomClassId(req.user!.userId, req.user!.teacherId)
        : undefined;

    const { data, meta } = await attendanceService.listAttendance(input, scopedClassId);
    return res.json({ success: true, message: "Data absensi berhasil diambil", data, meta });
  } catch (err) {
    next(err);
  }
}
