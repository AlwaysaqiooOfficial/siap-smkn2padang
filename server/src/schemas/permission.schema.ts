import { z } from "zod";

export const createPermissionSchema = z.object({
  studentId: z.string().cuid(),
  type: z.enum(["IZIN", "SAKIT", "DISPENSASI"]),
  reason: z.string().trim().min(3).max(500),
  date: z.coerce.date(),
  attachment: z.string().trim().max(255).optional(),
});

export const reviewPermissionSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const listPermissionSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  studentId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type ReviewPermissionInput = z.infer<typeof reviewPermissionSchema>;
export type ListPermissionInput = z.infer<typeof listPermissionSchema>;
