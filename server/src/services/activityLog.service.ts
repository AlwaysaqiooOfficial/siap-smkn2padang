import { transaction } from "./jsonDatabase";

export async function createActivityLog(data: Record<string, any>) {
  try {
    await transaction(async (db) => {
      db.create("activity_logs", {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      });
    });
  } catch {
    // Activity logs are best-effort and must never fail the main request.
  }
}
