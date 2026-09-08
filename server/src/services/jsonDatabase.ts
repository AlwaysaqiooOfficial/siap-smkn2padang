import { githubJsonStore } from "./githubJsonStore";

export type JsonRecord = { id: string; [key: string]: any };
export type JsonCollection = Record<string, JsonRecord>;

interface Transaction {
  changes: Map<string, JsonCollection>;
  timestamp: number;
}

let txQueue = Promise.resolve();
const collections = new Map<string, JsonCollection>();
let lastSync = 0;
const SYNC_INTERVAL = 5000; // Sync ke GitHub setiap 5 detik

/**
 * Load semua file koleksi dari GitHub ke memory cache
 */
export async function loadCollections() {
  console.log("📥 Loading collections dari GitHub...");
  
  const files = [
    "users.json",
    "teachers.json",
    "classes.json",
    "majors.json",
    "academic_years.json",
    "semesters.json",
    "school_settings.json",
    "violation_categories.json",
  ];

  for (const file of files) {
    const collectionName = file.replace(".json", "");
    const data = await githubJsonStore.read<JsonRecord[]>(file, []);
    
    // Index array ke map berdasarkan ID
    const indexed: JsonCollection = {};
    for (const record of data) {
      if (record && record.id && typeof record.id === "string") {
        indexed[record.id] = record;
      }
    }
    collections.set(collectionName, indexed);
  }

  // Load students dari semua file kelas
  const classesCollection = collections.get("classes") || {};
  const classIds = Object.values(classesCollection).map((cls: any) => cls.id);
  const studentsCollection: JsonCollection = {};
  
  for (const classId of classIds) {
    const students = await githubJsonStore.read<JsonRecord[]>(`students/${classId}.json`, []);
    for (const student of students) {
      if (student && student.id && typeof student.id === "string") {
        studentsCollection[student.id] = student;
      }
    }
  }
  collections.set("students", studentsCollection);

  lastSync = Date.now();
  console.log("✅ Collections loaded");
}

/**
 * Dapatkan satu record dari koleksi
 */
export function findOne<T extends JsonRecord = JsonRecord>(collection: string, id: string): T | undefined {
  const coll = collections.get(collection);
  return coll ? (coll[id] as T | undefined) : undefined;
}

/**
 * Dapatkan semua record dari koleksi
 */
export function findAll<T extends JsonRecord = JsonRecord>(collection: string): T[] {
  const coll = collections.get(collection);
  return coll ? (Object.values(coll) as T[]) : [];
}

/**
 * Filter record dalam koleksi
 */
export function findFilter<T extends JsonRecord = JsonRecord>(
  collection: string,
  predicate: (record: T) => boolean
): T[] {
  return findAll<T>(collection).filter(predicate);
}

/**
 * Cari satu record yang memenuhi kondisi
 */
export function findFirst<T extends JsonRecord = JsonRecord>(
  collection: string,
  predicate: (record: T) => boolean
): T | undefined {
  return findAll<T>(collection).find(predicate);
}

/**
 * Hitung record yang memenuhi kondisi
 */
export function countFilter<T extends JsonRecord = JsonRecord>(
  collection: string,
  predicate: (record: T) => boolean
): number {
  return findAll<T>(collection).filter(predicate).length;
}

/**
 * Mulai transaksi: queue operasi tulis
 */
export async function transaction<T>(
  mutator: (db: Database) => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    txQueue = txQueue
      .then(async () => {
        try {
          const db = new Database();
          const result = await mutator(db);
          await db.commit();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
      .catch(reject);
  });
}

/**
 * API Database yang dipakai dalam transaksi
 */
export class Database {
  private changes = new Map<string, Map<string, JsonRecord>>();

  findOne<T extends JsonRecord = JsonRecord>(collection: string, id: string): T | undefined {
    // Cek dulu di changes, baru ke memory cache
    const changed = this.changes.get(collection);
    if (changed) {
      const record = changed.get(id);
      if (record) return record as T;
      if (record === null) return undefined; // Sudah dihapus
    }
    return findOne<T>(collection, id);
  }

  findAll<T extends JsonRecord = JsonRecord>(collection: string): T[] {
    const base = findAll<T>(collection);
    const changed = this.changes.get(collection);
    
    if (!changed) return base;

    const result = new Map<string, T>();
    for (const record of base) {
      if ((record as any).id) {
        result.set((record as any).id, record);
      }
    }

    for (const [id, record] of changed) {
      if (record === null) {
        result.delete(id);
      } else {
        result.set(id, record as T);
      }
    }

    return Array.from(result.values());
  }

  findFilter<T extends JsonRecord = JsonRecord>(
    collection: string,
    predicate: (record: T) => boolean
  ): T[] {
    return this.findAll<T>(collection).filter(predicate);
  }

  findFirst<T extends JsonRecord = JsonRecord>(
    collection: string,
    predicate: (record: T) => boolean
  ): T | undefined {
    return this.findAll<T>(collection).find(predicate);
  }

  countFilter<T extends JsonRecord = JsonRecord>(
    collection: string,
    predicate: (record: T) => boolean
  ): number {
    return this.findAll<T>(collection).filter(predicate).length;
  }

  create<T extends JsonRecord = JsonRecord>(collection: string, record: T): T {
    if (!record.id) throw new Error("Record harus memiliki field 'id'");
    
    if (this.findOne<T>(collection, (record as any).id)) {
      throw new Error(`Record ${(record as any).id} sudah ada di ${collection}`);
    }

    if (!this.changes.has(collection)) {
      this.changes.set(collection, new Map());
    }
    this.changes.get(collection)!.set((record as any).id, record);
    return record;
  }

  update<T extends JsonRecord = JsonRecord>(collection: string, id: string, updates: Partial<T>): T {
    const existing = this.findOne<T>(collection, id);
    if (!existing) throw new Error(`Record ${id} tidak ditemukan di ${collection}`);

    const updated = { ...existing, ...updates, id } as T;
    if (!this.changes.has(collection)) {
      this.changes.set(collection, new Map());
    }
    this.changes.get(collection)!.set(id, updated);
    return updated;
  }

  delete(collection: string, id: string): void {
    if (!this.findOne(collection, id)) {
      throw new Error(`Record ${id} tidak ditemukan di ${collection}`);
    }

    if (!this.changes.has(collection)) {
      this.changes.set(collection, new Map());
    }
    this.changes.get(collection)!.set(id, null as any);
  }

  async commit(): Promise<void> {
    // Sync perubahan ke memory cache dan GitHub
    for (const [collectionName, changeMap] of this.changes) {
      const collection = collections.get(collectionName) || {};
      
      for (const [id, record] of changeMap) {
        if (record === null) {
          delete collection[id];
        } else {
          collection[id] = record;
        }
      }
      collections.set(collectionName, collection);
    }

    // Push ke GitHub
    await syncToGitHub();
  }
}

/**
 * Sync semua koleksi ke GitHub
 */
async function syncToGitHub(): Promise<void> {
  const now = Date.now();
  if (now - lastSync < SYNC_INTERVAL) {
    return; // Debounce: jangan sync terlalu sering
  }
  lastSync = now;

  const message = `chore: auto-sync database changes at ${new Date().toISOString()}`;

  // Sync master data
  const filesToSync = [
    { name: "users", file: "users.json" },
    { name: "teachers", file: "teachers.json" },
    { name: "classes", file: "classes.json" },
    { name: "majors", file: "majors.json" },
    { name: "academic_years", file: "academic_years.json" },
    { name: "semesters", file: "semesters.json" },
    { name: "school_settings", file: "school_settings.json" },
    { name: "violation_categories", file: "violation_categories.json" },
  ];

  for (const { name, file } of filesToSync) {
    const collection = collections.get(name);
    if (collection) {
      const data = Object.values(collection);
      await githubJsonStore.write(file, data, message);
    }
  }

  // Sync students per kelas
  const students = collections.get("students") || {};
  const classesColl = collections.get("classes") || {};
  
  for (const classId of Object.keys(classesColl)) {
    const classStudents = Object.values(students).filter(
      (s: any) => s.classId === classId
    );
    await githubJsonStore.write(`students/${classId}.json`, classStudents, message);
  }
}
