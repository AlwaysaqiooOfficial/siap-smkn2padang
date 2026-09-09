import { z } from "zod";

export const createViolationCategorySchema = z.object({
  name: z.string().trim().min(3).max(100),
  points: z.coerce.number().int().min(0).max(1000),
});

export const updateViolationCategorySchema = createViolationCategorySchema.partial();

export type CreateViolationCategoryInput = z.infer<typeof createViolationCategorySchema>;
export type UpdateViolationCategoryInput = z.infer<typeof updateViolationCategorySchema>;
