import type { NextFunction, Request, Response } from "express";
import {
  customReportSchema,
  dailyReportSchema,
  monthlyReportSchema,
  semesterReportSchema,
  weeklyReportSchema,
  type ReportFilter,
  overviewReportSchema,
} from "../schemas/report.schema";
import {
  resolveDailyRange,
  resolveWeeklyRange,
  resolveMonthlyRange,
  resolveCustomRange,
  type DateRange,
} from "../utils/dateRange";
import * as reportService from "../services/report.service";
import { getHomeroomClassId } from "../services/homeroom.helper";
import { prisma } from "../config/db";
import { ok } from "../utils/apiResponse";

async function resolveScopedClassId(req: Request): Promise<string | undefined> {
  if (req.user!.role === "WALI_KELAS" || req.user!.role === "GURU") {
    return getHomeroomClassId(req.user!.userId, req.user!.teacherId);
  }
  return undefined;
}

export async function overview(req: Request, res: Response, next: NextFunction) {
  try {
    const input = overviewReportSchema.parse(req.query);
    const scopedClassId = await resolveScopedClassId(req);
    const data = await reportService.buildAttendanceOverview(input, scopedClassId);
    return ok(res, data, "Ringkasan kehadiran berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

async function handleReport(
  req: Request,
  res: Response,
  next: NextFunction,
  range: DateRange,
  filter: ReportFilter
) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    const requester = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        teacher: { select: { fullName: true } },
        parent: { select: { fullName: true } },
        username: true,
      },
    });
    const generatedBy =
      requester?.teacher?.fullName ?? requester?.parent?.fullName ?? requester?.username ?? "System";

    const result = await reportService.buildAttendanceReport(range, filter, generatedBy, scopedClassId);

    if (filter.export) {
      const file = await reportService.exportReport(filter.export, result);

      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: "EXPORT_REPORT",
          entity: "Report",
          ipAddress: req.ip,
          metadata: { format: filter.export, periodLabel: range.label, totalRecords: result.summary.totalRecords },
        },
      });

      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
      return res.send(file.buffer);
    }

    return ok(res, result, "Laporan berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function daily(req: Request, res: Response, next: NextFunction) {
  try {
    const input = dailyReportSchema.parse(req.query);
    const range = resolveDailyRange(input.date);
    await handleReport(req, res, next, range, input);
  } catch (err) {
    next(err);
  }
}

export async function weekly(req: Request, res: Response, next: NextFunction) {
  try {
    const input = weeklyReportSchema.parse(req.query);
    const range = resolveWeeklyRange(input.date);
    await handleReport(req, res, next, range, input);
  } catch (err) {
    next(err);
  }
}

export async function monthly(req: Request, res: Response, next: NextFunction) {
  try {
    const input = monthlyReportSchema.parse(req.query);
    const range = resolveMonthlyRange(input.month, input.year);
    await handleReport(req, res, next, range, input);
  } catch (err) {
    next(err);
  }
}

export async function semester(req: Request, res: Response, next: NextFunction) {
  try {
    const input = semesterReportSchema.parse(req.query);
    const range = await reportService.resolveSemesterRange(input.semesterId);
    await handleReport(req, res, next, range, input);
  } catch (err) {
    next(err);
  }
}

export async function custom(req: Request, res: Response, next: NextFunction) {
  try {
    const input = customReportSchema.parse(req.query);
    const range = resolveCustomRange(input.startDate, input.endDate);
    await handleReport(req, res, next, range, input);
  } catch (err) {
    next(err);
  }
}
