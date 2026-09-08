import type { NextFunction, Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import {
  getHomeroomClassId,
  getTeacherIdByUserId,
  getStudentIdByUserId,
  getParentIdByUserId,
} from "../services/homeroom.helper";
import { ok } from "../utils/apiResponse";

export async function admin(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getAdminDashboard();
    return ok(res, data, "Dashboard admin berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function waliKelas(req: Request, res: Response, next: NextFunction) {
  try {
    const classId = await getHomeroomClassId(req.user!.userId);
    const data = await dashboardService.getWaliKelasDashboard(classId, {
      date: req.query.date as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });
    return ok(res, data, "Dashboard wali kelas berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function guru(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherIdByUserId(req.user!.userId, req.user!.teacherId);
    const data = await dashboardService.getGuruDashboard(teacherId, req.user!.userId);
    return ok(res, data, "Dashboard guru berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function scanner(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getScannerDashboard();
    return ok(res, data, "Ringkasan scanner berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function siswa(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentIdByUserId(req.user!.userId);
    const data = await dashboardService.getSiswaDashboard(studentId);
    return ok(res, data, "Dashboard siswa berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function orangTua(req: Request, res: Response, next: NextFunction) {
  try {
    const parentId = await getParentIdByUserId(req.user!.userId);
    const data = await dashboardService.getOrangTuaDashboard(parentId);
    return ok(res, data, "Dashboard orang tua berhasil diambil");
  } catch (err) {
    next(err);
  }
}
