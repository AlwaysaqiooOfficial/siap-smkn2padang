import { findOne, findAll, findFilter, findFirst, transaction } from "./jsonDatabase";

// ============================================================
// USER REPOSITORY
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "SCANNER" | "WALI_KELAS" | "GURU" | "ORANG_TUA" | "SISWA";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const UserRepository = {
  findMany: () => findAll<User>("users"),
  findUnique: (id: string) => findOne<User>("users", id),
  findFirst: (predicate: (u: User) => boolean) => findFirst<User>("users", predicate),
  
  create: async (data: User) => {
    return transaction(async (db) => {
      const existing = db.findFirst<User>("users", (u) => u.email === data.email || u.username === data.username);
      if (existing) throw new Error("Email atau username sudah dipakai");
      return db.create("users", data);
    });
  },

  update: async (id: string, data: Partial<User>) => {
    return transaction(async (db) => {
      return db.update<User>("users", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("users", id);
    });
  },
};

// ============================================================
// TEACHER REPOSITORY
// ============================================================

export interface Teacher {
  id: string;
  userId: string | null;
  nip: string;
  fullName: string;
  phone: string;
  isHomeroom: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const TeacherRepository = {
  findMany: () => findAll<Teacher>("teachers"),
  findUnique: (id: string) => findOne<Teacher>("teachers", id),
  findFirst: (predicate: (t: Teacher) => boolean) => findFirst<Teacher>("teachers", predicate),

  create: async (data: Teacher) => {
    return transaction(async (db) => {
      const existing = db.findFirst<Teacher>("teachers", (t) => t.nip === data.nip);
      if (existing) throw new Error("NIP sudah terdaftar");
      return db.create("teachers", data);
    });
  },

  update: async (id: string, data: Partial<Teacher>) => {
    return transaction(async (db) => {
      return db.update<Teacher>("teachers", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("teachers", id);
    });
  },
};

// ============================================================
// MAJOR REPOSITORY
// ============================================================

export interface Major {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const MajorRepository = {
  findMany: () => findAll<Major>("majors"),
  findUnique: (id: string) => findOne<Major>("majors", id),
  findFirst: (predicate: (m: Major) => boolean) => findFirst<Major>("majors", predicate),
  findFilter: (predicate: (m: Major) => boolean) => findFilter<Major>("majors", predicate),
  
  create: async (data: Major) => {
    return transaction(async (db) => {
      const existing = db.findFirst<Major>("majors", (m) => m.code === data.code);
      if (existing) throw new Error("Kode jurusan sudah ada");
      return db.create("majors", data);
    });
  },

  update: async (id: string, data: Partial<Major>) => {
    return transaction(async (db) => {
      return db.update<Major>("majors", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("majors", id);
    });
  },
};

// ============================================================
// CLASS REPOSITORY
// ============================================================

export interface Class {
  id: string;
  name: string;
  grade: number;
  majorId: string;
  homeroomTeacherId: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const ClassRepository = {
  findMany: () => findAll<Class>("classes"),
  findUnique: (id: string) => findOne<Class>("classes", id),
  findFirst: (predicate: (c: Class) => boolean) => findFirst<Class>("classes", predicate),
  findFilter: (predicate: (c: Class) => boolean) => findFilter<Class>("classes", predicate),

  create: async (data: Class) => {
    return transaction(async (db) => {
      const major = db.findOne<Major>("majors", data.majorId);
      if (!major) throw new Error("Jurusan tidak ditemukan");

      const existing = db.findFirst<Class>("classes", (c) => c.name === data.name && c.majorId === data.majorId);
      if (existing) throw new Error("Nama kelas sudah ada di jurusan ini");

      return db.create("classes", data);
    });
  },

  update: async (id: string, data: Partial<Class>) => {
    return transaction(async (db) => {
      return db.update<Class>("classes", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("classes", id);
    });
  },
};

// ============================================================
// STUDENT REPOSITORY
// ============================================================

export interface Student {
  id: string;
  userId: string | null;
  nis: string;
  nisn: string;
  fullName: string;
  gender: "L" | "P";
  birthDate: string;
  address: string | null;
  majorId: string;
  classId: string;
  parentId: string | null;
  parentFullName?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
  parentAddress?: string | null;
  qrToken: string;
  isActive: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: any;
  attendance?: any;
  [key: string]: any;
}

export const StudentRepository = {
  findMany: () => findAll<Student>("students"),
  findUnique: (id: string) => findOne<Student>("students", id),
  findFirst: (predicate: (s: Student) => boolean) => findFirst<Student>("students", predicate),
  findFilter: (predicate: (s: Student) => boolean) => findFilter<Student>("students", predicate),
  count: (predicate: (s: Student) => boolean) => 
    findAll<Student>("students").filter(predicate).length,

  create: async (data: Student) => {
    return transaction(async (db) => {
      const nisTaken = db.findFirst<Student>("students", (s) => s.nis === data.nis);
      const nisnTaken = db.findFirst<Student>("students", (s) => s.nisn === data.nisn);
      
      if (nisTaken) throw new Error("NIS sudah terdaftar");
      if (nisnTaken) throw new Error("NISN sudah terdaftar");

      const schoolClass = db.findOne<Class>("classes", data.classId);
      if (!schoolClass) throw new Error("Kelas tidak ditemukan");

      return db.create("students", data);
    });
  },

  update: async (id: string, data: Partial<Student>) => {
    return transaction(async (db) => {
      return db.update<Student>("students", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("students", id);
    });
  },
};

// ============================================================
// SEMESTER REPOSITORY
// ============================================================

export interface Semester {
  id: string;
  academicYearId: string;
  name: string;
  order: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const SemesterRepository = {
  findMany: () => findAll<Semester>("semesters"),
  findUnique: (id: string) => findOne<Semester>("semesters", id),
  findFirst: (predicate: (s: Semester) => boolean) => findFirst<Semester>("semesters", predicate),
};

// ============================================================
// SCHOOL SETTINGS REPOSITORY
// ============================================================

export interface SchoolSetting {
  id: string; // same as key
  key: string;
  value: string;
  [key: string]: any;
}

export const SchoolSettingRepository = {
  findMany: () => findAll<SchoolSetting>("school_settings"),
  findFirst: (predicate: (s: SchoolSetting) => boolean) => findFirst<SchoolSetting>("school_settings", predicate),
};

// ============================================================
// ATTENDANCE REPOSITORY
// ============================================================

export interface Attendance {
  id: string;
  studentId: string;
  semesterId: string;
  date: string;
  checkInTime: string | null;
  status: "HADIR" | "TERLAMBAT" | "ALFA" | "IZIN" | "SAKIT" | "DISPENSASI";
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const AttendanceRepository = {
  findMany: () => findAll<Attendance>("attendance"),
  findUnique: (id: string) => findOne<Attendance>("attendance", id),
  findFirst: (predicate: (a: Attendance) => boolean) => findFirst<Attendance>("attendance", predicate),
  findFilter: (predicate: (a: Attendance) => boolean) => findFilter<Attendance>("attendance", predicate),
  count: (predicate: (a: Attendance) => boolean) => findAll<Attendance>("attendance").filter(predicate).length,

  create: async (data: Attendance) => {
    return transaction(async (db) => {
      const existing = db.findFirst<Attendance>("attendance", 
        (a) => a.studentId === data.studentId && a.date === data.date && a.semesterId === data.semesterId
      );
      if (existing) throw new Error("Attendance sudah tercatat untuk hari ini");
      return db.create("attendance", data);
    });
  },

  update: async (id: string, data: Partial<Attendance>) => {
    return transaction(async (db) => {
      return db.update<Attendance>("attendance", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("attendance", id);
    });
  },
};

// ============================================================
// PERMISSION REPOSITORY
// ============================================================

export interface Permission {
  id: string;
  studentId: string;
  semesterId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  type: "IZIN" | "SAKIT" | "DISPENSASI";
  attachment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy: string | null;
  approvedAt: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const PermissionRepository = {
  findMany: () => findAll<Permission>("permissions"),
  findUnique: (id: string) => findOne<Permission>("permissions", id),
  findFirst: (predicate: (p: Permission) => boolean) => findFirst<Permission>("permissions", predicate),
  findFilter: (predicate: (p: Permission) => boolean) => findFilter<Permission>("permissions", predicate),

  create: async (data: Permission) => {
    return transaction(async (db) => {
      return db.create("permissions", data);
    });
  },

  update: async (id: string, data: Partial<Permission>) => {
    return transaction(async (db) => {
      return db.update<Permission>("permissions", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("permissions", id);
    });
  },
};

// ============================================================
// VIOLATION REPOSITORY
// ============================================================

export interface Violation {
  id: string;
  studentId: string;
  semesterId: string;
  violationCategoryId: string;
  categoryId?: string;
  date: string;
  description: string;
  point: number;
  points?: number;
  teacherId?: string;
  status?: "REPORTED" | "REVIEWED" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const ViolationRepository = {
  findMany: () => findAll<Violation>("violations"),
  findUnique: (id: string) => findOne<Violation>("violations", id),
  findFilter: (predicate: (v: Violation) => boolean) => findFilter<Violation>("violations", predicate),
  count: (predicate: (v: Violation) => boolean) => findAll<Violation>("violations").filter(predicate).length,

  create: async (data: Violation) => {
    return transaction(async (db) => {
      return db.create("violations", data);
    });
  },

  update: async (id: string, data: Partial<Violation>) => {
    return transaction(async (db) => {
      return db.update<Violation>("violations", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("violations", id);
    });
  },
};

// ============================================================
// VIOLATION CATEGORY REPOSITORY
// ============================================================

export interface ViolationCategory {
  id: string;
  name: string;
  points: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const ViolationCategoryRepository = {
  findMany: () => findAll<ViolationCategory>("violation_categories"),
  findUnique: (id: string) => findOne<ViolationCategory>("violation_categories", id),
  findFirst: (predicate: (v: ViolationCategory) => boolean) => findFirst<ViolationCategory>("violation_categories", predicate),

  create: async (data: ViolationCategory) => {
    return transaction(async (db) => {
      return db.create("violation_categories", data);
    });
  },

  update: async (id: string, data: Partial<ViolationCategory>) => {
    return transaction(async (db) => {
      return db.update<ViolationCategory>("violation_categories", id, { ...data, updatedAt: new Date().toISOString() });
    });
  },

  delete: async (id: string) => {
    return transaction(async (db) => {
      db.delete("violation_categories", id);
    });
  },
};
