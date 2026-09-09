import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const tableNames: Record<string, string> = {
  email_queue: "email_logs",
};

const collectionNames = [
  "users",
  "parents",
  "teachers",
  "classes",
  "majors",
  "academic_years",
  "semesters",
  "school_settings",
  "violation_categories",
  "attendance",
  "permissions",
  "violations",
  "notifications",
  "email_queue",
  "students",
];

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function fromDatabaseRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [toCamelCase(key), value]));
}

function toDatabaseRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => !["parent", "attendance"].includes(key))
      .map(([key, value]) => [toSnakeCase(key), value])
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

function getClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi");
  }
  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function tableFor(collection: string): string {
  return tableNames[collection] ?? collection;
}

export async function readCollection(collection: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await getClient().from(tableFor(collection)).select("*");
  if (error) throw new Error(`Supabase gagal membaca ${collection}: ${error.message}`);
  return (data ?? []).map((row) => fromDatabaseRecord(row as Record<string, unknown>));
}

export async function upsertCollection(collection: string, records: Record<string, unknown>[]): Promise<void> {
  if (!records.length) return;
  const { error } = await getClient().from(tableFor(collection)).upsert(records.map(toDatabaseRecord), { onConflict: "id" });
  if (error) throw new Error(`Supabase gagal menyimpan ${collection}: ${error.message}`);
}

export async function deleteFromCollection(collection: string, id: string): Promise<void> {
  const { error } = await getClient().from(tableFor(collection)).delete().eq("id", id);
  if (error) throw new Error(`Supabase gagal menghapus ${collection}/${id}: ${error.message}`);
}

export { collectionNames };
