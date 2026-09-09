import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Email/username wajib diisi"), // email atau username
  password: z.string().min(4, "Password minimal 4 karakter"),
  teacherName: z.string().trim().min(3).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
