import { z } from "zod";

export const scanAttendanceSchema = z.object({
  token: z.string().trim().min(5, "Token QR tidak valid"),
});

export const listAttendanceSchema = z.object({
  date: z.coerce.date().optional(), // default: hari ini
  classId: z.string().cuid().optional(),
  status: z.enum(["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "DISPENSASI", "ALFA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ScanAttendanceInput = z.infer<typeof scanAttendanceSchema>;
export type ListAttendanceInput = z.infer<typeof listAttendanceSchema>;
