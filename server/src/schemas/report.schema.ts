import { z } from "zod";

const baseFilterSchema = z.object({
  majorId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  studentId: z.string().cuid().optional(),
  status: z.enum(["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "DISPENSASI", "ALFA"]).optional(),
  export: z.enum(["excel", "pdf", "csv"]).optional(),
});

export const dailyReportSchema = baseFilterSchema.extend({
  date: z.string().optional(), // default: hari ini
});

export const weeklyReportSchema = baseFilterSchema.extend({
  date: z.string().optional(), // tanggal mana saja dalam minggu yang diinginkan
});

export const monthlyReportSchema = baseFilterSchema.extend({
  month: z.string().optional(), // 1-12, default bulan berjalan
  year: z.string().optional(),
});

export const semesterReportSchema = baseFilterSchema.extend({
  semesterId: z.string().cuid().optional(), // default: semester aktif
});

export const customReportSchema = baseFilterSchema.extend({
  startDate: z.string(),
  endDate: z.string(),
});

export const overviewReportSchema = z.object({
  period: z.enum(["today", "week", "month", "semester"]).default("today"),
  classId: z.string().cuid().optional(),
  semesterId: z.string().cuid().optional(),
});

export type DailyReportInput = z.infer<typeof dailyReportSchema>;
export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>;
export type MonthlyReportInput = z.infer<typeof monthlyReportSchema>;
export type SemesterReportInput = z.infer<typeof semesterReportSchema>;
export type CustomReportInput = z.infer<typeof customReportSchema>;
export type ReportFilter = z.infer<typeof baseFilterSchema>;
export type OverviewReportInput = z.infer<typeof overviewReportSchema>;
