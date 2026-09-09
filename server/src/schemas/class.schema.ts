import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(3).max(50), // "X RPL 1"
  grade: z.coerce.number().int().refine((v) => [10, 11, 12].includes(v), {
    message: "grade harus 10, 11, atau 12",
  }),
  majorId: z.string().trim().min(1),
  homeroomTeacherId: z.string().trim().min(1).nullable().optional(),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
