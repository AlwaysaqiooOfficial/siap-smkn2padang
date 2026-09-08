import { z } from "zod";

export const createViolationSchema = z.object({
  studentId: z.string().cuid(),
  categoryId: z.string().cuid(),
  description: z.string().trim().max(500).optional(),
  date: z.coerce.date(),
  points: z.coerce.number().int().min(0).max(1000).optional(), // override poin kategori jika perlu
});

export const updateViolationSchema = z.object({
  categoryId: z.string().cuid().optional(),
  description: z.string().trim().max(500).optional(),
  points: z.coerce.number().int().min(0).max(1000).optional(),
  status: z.enum(["REPORTED", "REVIEWED", "RESOLVED"]).optional(),
});

export const listViolationSchema = z.object({
  studentId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  status: z.enum(["REPORTED", "REVIEWED", "RESOLVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateViolationInput = z.infer<typeof createViolationSchema>;
export type UpdateViolationInput = z.infer<typeof updateViolationSchema>;
export type ListViolationInput = z.infer<typeof listViolationSchema>;
