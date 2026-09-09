import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function toSkipTake(input: PaginationInput) {
  return { skip: (input.page - 1) * input.limit, take: input.limit };
}

export function meta(total: number, input: PaginationInput) {
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.ceil(total / input.limit) || 1,
  };
}
