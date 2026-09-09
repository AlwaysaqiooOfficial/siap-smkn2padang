import {
  collectionNames as supabaseCollections,
  deleteFromCollection,
  isSupabaseConfigured,
  readCollection,
  upsertCollection,
} from "./supabaseJsonStore";

export type JsonRecord = { id: string; [key: string]: any };
export type JsonCollection = Record<string, JsonRecord>;

let txQueue = Promise.resolve();
const collections = new Map<string, JsonCollection>();
let syncQueue = Promise.resolve();

export async function loadCollections() {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi");
  }

  console.log("Loading collections dari Supabase...");
  for (const collectionName of supabaseCollections) {
    const records = await readCollection(collectionName);
    const indexed: JsonCollection = {};
    for (const record of records) {
      if (record.id && typeof record.id === "string") indexed[record.id] = record as JsonRecord;
    }
    collections.set(collectionName, indexed);
  }

  ensureActiveSemester();
  console.log("Collections loaded from Supabase");
}

function ensureActiveSemester() {
  const semesters = collections.get("semesters") || {};
  if (Object.values(semesters).some((semester: any) => semester.isActive === true)) return;

  const now = new Date();
  const year = now.getFullYear();
  const isFirstSemester = now.getMonth() >= 6;
  const academicStartYear = isFirstSemester ? year : year - 1;
  const name = isFirstSemester ? "Ganjil" : "Genap";
  const id = `semester-default-${academicStartYear}-${name.toLowerCase()}`;
  semesters[id] = {
    id,
    academicYearId: `academic-year-default-${academicStartYear}`,
    name,
    order: isFirstSemester ? 1 : 2,
    startDate: isFirstSemester ? `${academicStartYear}-07-01` : `${academicStartYear + 1}-01-01`,
    endDate: isFirstSemester ? `${academicStartYear}-12-31` : `${academicStartYear + 1}-06-30`,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  collections.set("semesters", semesters);
}

export function findOne<T extends JsonRecord = JsonRecord>(collection: string, id: string): T | undefined {
  return collections.get(collection)?.[id] as T | undefined;
}

export function findAll<T extends JsonRecord = JsonRecord>(collection: string): T[] {
  return Object.values(collections.get(collection) || {}) as T[];
}

export function findFilter<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): T[] {
  return findAll<T>(collection).filter(predicate);
}

export function findFirst<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): T | undefined {
  return findAll<T>(collection).find(predicate);
}

export function countFilter<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): number {
  return findFilter(collection, predicate).length;
}

export async function transaction<T>(mutator: (db: Database) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    txQueue = txQueue.then(async () => {
      try {
        const db = new Database();
        const result = await mutator(db);
        await db.commit();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }).catch(reject);
  });
}

export class Database {
  private changes = new Map<string, Map<string, JsonRecord | null>>();

  findOne<T extends JsonRecord = JsonRecord>(collection: string, id: string): T | undefined {
    const changed = this.changes.get(collection);
    if (changed?.has(id)) return changed.get(id) as T | undefined;
    return findOne<T>(collection, id);
  }

  findAll<T extends JsonRecord = JsonRecord>(collection: string): T[] {
    const result = new Map(findAll<T>(collection).map((record) => [record.id, record]));
    for (const [id, record] of this.changes.get(collection) || []) {
      if (record === null) result.delete(id);
      else result.set(id, record as T);
    }
    return [...result.values()];
  }

  findFilter<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): T[] {
    return this.findAll<T>(collection).filter(predicate);
  }

  findFirst<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): T | undefined {
    return this.findAll<T>(collection).find(predicate);
  }

  countFilter<T extends JsonRecord = JsonRecord>(collection: string, predicate: (record: T) => boolean): number {
    return this.findFilter(collection, predicate).length;
  }

  create<T extends JsonRecord = JsonRecord>(collection: string, record: T): T {
    if (!record.id) throw new Error("Record harus memiliki field 'id'");
    if (this.findOne(collection, record.id)) throw new Error(`Record ${record.id} sudah ada di ${collection}`);
    this.change(collection, record.id, record);
    return record;
  }

  update<T extends JsonRecord = JsonRecord>(collection: string, id: string, updates: Partial<T>): T {
    const existing = this.findOne<T>(collection, id);
    if (!existing) throw new Error(`Record ${id} tidak ditemukan di ${collection}`);
    const updated = { ...existing, ...updates, id } as T;
    this.change(collection, id, updated);
    return updated;
  }

  delete(collection: string, id: string): void {
    if (!this.findOne(collection, id)) throw new Error(`Record ${id} tidak ditemukan di ${collection}`);
    this.change(collection, id, null);
  }

  private change(collection: string, id: string, record: JsonRecord | null) {
    if (!this.changes.has(collection)) this.changes.set(collection, new Map());
    this.changes.get(collection)!.set(id, record);
  }

  async commit() {
    for (const [collectionName, changeMap] of this.changes) {
      const collection = collections.get(collectionName) || {};
      const upserts: JsonRecord[] = [];
      for (const [id, record] of changeMap) {
        if (record === null) delete collection[id];
        else {
          collection[id] = record;
          upserts.push(record);
        }
      }
      collections.set(collectionName, collection);
      const operation = syncQueue.then(async () => {
        for (const [id, record] of changeMap) {
          if (record === null) await deleteFromCollection(collectionName, id);
        }
        await upsertCollection(collectionName, upserts);
      });
      syncQueue = operation.catch((error) => console.error("Supabase sync gagal:", error));
    }
  }
}
