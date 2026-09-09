import { z } from "zod";

export const createMajorSchema = z.object({
  code: z.string().trim().min(2).max(10).toUpperCase(),
  name: z.string().trim().min(3).max(100),
});

export const updateMajorSchema = createMajorSchema.partial();

export type CreateMajorInput = z.infer<typeof createMajorSchema>;
export type UpdateMajorInput = z.infer<typeof updateMajorSchema>;
