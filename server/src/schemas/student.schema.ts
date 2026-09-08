import { z } from "zod";
import { strongPasswordSchema } from "./common.schema";

export const createStudentSchema = z.object({
  nis: z.string().trim().min(3).max(20),
  nisn: z.string().trim().min(3).max(20),
  fullName: z.string().trim().min(3).max(100),
  gender: z.enum(["L", "P"]),
  birthDate: z.coerce.date(),
  address: z.string().trim().max(255).optional(),
  majorId: z.string().cuid(),
  classId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
});

export const updateStudentSchema = z.object({
  nis: z.string().trim().min(3).max(20).optional(),
  nisn: z.string().trim().min(3).max(20).optional(),
  fullName: z.string().trim().min(3).max(100).optional(),
  gender: z.enum(["L", "P"]).optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().trim().max(255).optional(),
  majorId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  parentId: z.string().cuid().nullable().optional(),
  parentEmail: z.string().email().optional(),
  parentFullName: z.string().trim().min(3).max(100).optional(),
  parentPhone: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const createStudentAccountSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(4).max(30),
  password: strongPasswordSchema,
});

export type CreateStudentAccountInput = z.infer<typeof createStudentAccountSchema>;

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
