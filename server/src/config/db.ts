import { transaction } from "../services/jsonDatabase";
import { TeacherRepository, UserRepository } from "../services/repositories";

/**
 * Compatibility facade for legacy controller code.
 * All supported operations use the Supabase-backed collection adapter.
 */
export const prisma: any = {
  activityLog: {
    create: async ({ data }: { data: Record<string, any> }) => transaction(async (db) => db.create("activity_logs", { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() })),
  },
  user: {
    findUnique: async ({ where }: any) => where.id ? UserRepository.findUnique(where.id) : UserRepository.findFirst((item) => item.email === where.email || item.username === where.username),
  },
  teacher: {
    findUnique: async ({ where }: any) => where.id ? TeacherRepository.findUnique(where.id) : TeacherRepository.findFirst((item) => item.userId === where.userId),
  },
};
