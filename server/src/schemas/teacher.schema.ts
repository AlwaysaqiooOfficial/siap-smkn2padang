import { z } from "zod";
export const createTeacherSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().trim().min(3).max(100),
  nip: z.string().trim().min(5).max(30).optional(),
  phone: z.string().trim().max(20).optional(),
  role: z.literal("GURU").default("GURU"),
});

export const updateTeacherSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().trim().min(3).max(100).optional(),
  nip: z.string().trim().min(5).max(30).optional(),
  phone: z.string().trim().max(20).optional(),
  role: z.literal("GURU").optional(),
  isActive: z.boolean().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
