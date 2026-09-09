import { z } from "zod";
import { strongPasswordSchema } from "./common.schema";

export const createParentSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(4).max(30),
  password: strongPasswordSchema,
  fullName: z.string().trim().min(3).max(100),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
});

export const updateParentSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().trim().min(4).max(30).optional(),
  password: strongPasswordSchema.optional(),
  fullName: z.string().trim().min(3).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
