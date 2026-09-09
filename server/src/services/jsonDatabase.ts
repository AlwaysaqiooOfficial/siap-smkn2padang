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
let syncQueue = Promise.resolve();

/**
 * Load semua file koleksi dari GitHub ke memory cache
 */
export async function loadCollections() {
  console.log("📥 Loading collections dari GitHub...");
  
  const files = [
    "users.json",
    "parents.json",
    "teachers.json",
    "classes.json",
    "majors.json",
    "academic_years.json",
    "semesters.json",
    "school_settings.json",
    "violation_categories.json",
    "attendance.json",
    "permissions.json",
    "violations.json",
    "notifications.json",
    "email_queue.json",
  ];

  for (const file of files) {
    const collectionName = file.replace(".json", "");
    const required = ["users.json", "teachers.json", "classes.json", "majors.json"].includes(file);
    const data = await githubJsonStore.read<JsonRecord[]>(file, [], required);
    
    // Index array ke map berdasarkan ID
    const indexed: JsonCollection = {};
    for (const rawRecord of data) {
      const record = normalizeRecord(collectionName, rawRecord);
      if (record && record.id && typeof record.id === "string") {
        indexed[record.id] = record;
      }
    }
    collections.set(collectionName, indexed);
  }

  ensureActiveSemester();

  // Load students dari semua file kelas
  const classesCollection = collections.get("classes") || {};
  const classIds = Object.values(classesCollection).map((cls: any) => cls.id);
  const studentsCollection: JsonCollection = {};
  
  for (const classId of classIds) {
    const students = await githubJsonStore.read<JsonRecord[]>(`students/${classId}.json`, []);
    for (const rawStudent of students) {
      const student = normalizeRecord("students", rawStudent);
      if (student && student.id && typeof student.id === "string") {
        studentsCollection[student.id] = student;
      }
    }
  }
  collections.set("students", studentsCollection);

  lastSync = Date.now();
  console.log("✅ Collections loaded");
}

function normalizeRecord(collection: string, rawRecord: JsonRecord): JsonRecord {
  const record: JsonRecord = { ...rawRecord };

  if (collection === "users") {
    record.id = String(record.id ?? record.userId ?? record.username ?? record.email);
    record.passwordHash = record.passwordHash ?? record.password_hash ?? record.password;
    record.role = normalizeRole(record.role ?? record.userRole ?? record.type);
    record.isActive = record.isActive ?? record.active ?? true;
    record.username = record.username ?? record.user_name ?? record.email;
  }

  if (collection === "teachers") {
    record.id = String(record.id ?? record.teacherId ?? record.nip);
    record.userId = record.userId ?? record.user_id ?? record.user?.id ?? null;
    record.fullName = record.fullName ?? record.full_name ?? record.name ?? "";
    record.isHomeroom = record.isHomeroom ?? record.is_homeroom ?? false;
  }

  if (collection === "semesters") {
    record.isActive = record.isActive ?? record.active ?? record.is_active ?? false;
  }

  return record;
}

function ensureActiveSemester() {
  const semesters = collections.get("semesters") || {};
  if (Object.values(semesters).some((semester: any) => semester.isActive === true)) return;

  const now = new Date();
  const year = now.getFullYear();
  const isFirstSemester = now.getMonth() >= 6;
  const academicStartYear = isFirstSemester ? year : year - 1;
  const name = isFirstSemester ? "Ganjil" : "Genap";
  const startDate = isFirstSemester
    ? `${academicStartYear}-07-01`
    : `${academicStartYear + 1}-01-01`;
  const endDate = isFirstSemester
    ? `${academicStartYear}-12-31`
    : `${academicStartYear + 1}-06-30`;
  const id = `semester-default-${academicStartYear}-${name.toLowerCase()}`;

  semesters[id] = {
    id,
    academicYearId: `academic-year-default-${academicStartYear}`,
    name,
    order: isFirstSemester ? 1 : 2,
    startDate,
    endDate,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  collections.set("semesters", semesters);
  console.warn(`⚠️ Tidak ada semester aktif; memakai fallback ${name} ${academicStartYear}/${academicStartYear + 1}.`);
}

function normalizeRole(value: unknown): string {
  const role = String(value ?? "").trim().toUpperCase();
  if (role === "ADMIN" || role === "ADMINISTRATOR" || role === "SUPERADMIN") return "SUPER_ADMIN";
  if (role === "WALI KELAS" || role === "WALIKELAS") return "WALI_KELAS";
  if (role === "ORANG TUA" || role === "ORANGTUA" || role === "PARENT") return "ORANG_TUA";
  return role || "GURU";
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
    const changedStudentClassIds = new Set<string>();
    const studentChanges = this.changes.get("students");
    if (studentChanges) {
      for (const [id, record] of studentChanges) {
        const current = record ?? findOne<JsonRecord>("students", id);
        if (current?.classId) changedStudentClassIds.add(String(current.classId));
      }
    }

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

    // Return after the in-memory commit; GitHub sync continues in the background so a
    // slow GitHub request cannot make an already-saved API operation look like a failure.
    const changedCollections = [...this.changes.keys()];
    const syncOperation = syncQueue.then(() => syncToGitHub(changedCollections, [...changedStudentClassIds]));
    syncQueue = syncOperation.catch((error) => {
      console.error("❌ GitHub sync gagal:", error);
    });
  }
}

/**
 * Sync semua koleksi ke GitHub
 */
async function syncToGitHub(changedCollections: string[], changedStudentClassIds: string[]): Promise<void> {
  lastSync = Date.now();

  const message = `chore: auto-sync database changes at ${new Date().toISOString()}`;

  // Sync master data
  const filesToSync = [
    { name: "users", file: "users.json" },
    { name: "parents", file: "parents.json" },
    { name: "teachers", file: "teachers.json" },
    { name: "classes", file: "classes.json" },
    { name: "majors", file: "majors.json" },
    { name: "academic_years", file: "academic_years.json" },
    { name: "semesters", file: "semesters.json" },
    { name: "school_settings", file: "school_settings.json" },
    { name: "violation_categories", file: "violation_categories.json" },
    { name: "attendance", file: "attendance.json" },
    { name: "permissions", file: "permissions.json" },
    { name: "violations", file: "violations.json" },
    { name: "notifications", file: "notifications.json" },
    { name: "email_queue", file: "email_queue.json" },
  ];

  for (const { name, file } of filesToSync) {
    if (!changedCollections.includes(name)) continue;
    const collection = collections.get(name);
    if (collection) {
      const data = Object.values(collection);
      await githubJsonStore.write(file, data, message);
    }
  }

  // Sync students per kelas only when student/class data changed.
  if (!changedCollections.includes("students") && !changedCollections.includes("classes")) return;
  const students = collections.get("students") || {};
  const classesColl = collections.get("classes") || {};
  
  const classIds = changedStudentClassIds.length > 0 ? changedStudentClassIds : Object.keys(classesColl);
  for (const classId of classIds) {
    const classStudents = Object.values(students).filter(
      (s: any) => s.classId === classId
    );
    await githubJsonStore.write(`students/${classId}.json`, classStudents, message);
  }
}

