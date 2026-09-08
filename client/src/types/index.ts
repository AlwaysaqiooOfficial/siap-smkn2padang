export type Role = "SUPER_ADMIN" | "WALI_KELAS" | "GURU" | "SCANNER" | "SISWA" | "ORANG_TUA";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  fullName: string;
}

export interface LoginResponse {
  requiresTeacherName?: boolean;
  token?: string;
  user?: AuthUser;
}

export interface ScannerDashboardData {
  date: string;
  counts: Record<AttendanceStatus, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export type AttendanceStatus = "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "DISPENSASI" | "ALFA";

export interface ScanResultData {
  duplicate: boolean;
  status: AttendanceStatus;
  punctuality: "CEPAT" | "TEPAT_WAKTU" | "TERLAMBAT" | null;
  checkInTime: string | null;
  message: string;
  student: {
    id: string;
    nis: string;
    nisn: string;
    fullName: string;
    class: { id: string; name: string; grade: number };
    major: { id: string; code: string; name: string };
  };
}

export interface StudentSummary {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  class: { id: string; name: string };
  major: { id: string; code: string; name: string };
  parent: { fullName: string; phone: string | null; user: { email: string } } | null;
}

export interface AdminDashboardData {
  totals: { totalStudents: number; totalTeachers: number; totalClasses: number };
  todayCounts: Record<AttendanceStatus, number>;
  chartsByMajor: ({ majorCode: string; majorName: string } & Record<AttendanceStatus, number>)[];
  chartsByClass: ({ className: string } & Record<AttendanceStatus, number>)[];
  trend: ({ date: string } & Record<AttendanceStatus, number>)[];
  topAlfa: { studentId: string; studentName: string; className: string; count: number }[];
  topTerlambat: { studentId: string; studentName: string; className: string; count: number }[];
}

export interface WaliKelasDashboardData {
  classInfo: { id: string; name: string; majorName: string };
  date: string;
  totalStudents: number;
  counts: Record<AttendanceStatus, number>;
  attendancePercentage: number;
  students: { no: number; nis: string; fullName: string; status: string; checkInTime: string }[];
}

export interface MajorOption {
  id: string;
  code: string;
  name: string;
}

export interface ClassOption {
  id: string;
  name: string;
  grade: number;
  majorId: string;
}

export interface GuruDashboardData {
  teacherName: string;
  todayScanCount: number;
  totalViolationsReported: number;
  recentViolations: {
    id: string;
    studentName: string;
    className: string;
    categoryName: string;
    points: number;
    status: string;
    date: string;
  }[];
}

export interface SiswaDashboardData {
  profile: { fullName: string; nis: string; nisn: string; className: string; majorName: string };
  qrImage: string;
  todayStatus: string;
  history: { date: string; status: string; checkInTime: string }[];
}

export interface OrangTuaChildData {
  studentId: string;
  fullName: string;
  className: string;
  majorName: string;
  todayStatus: string;
  history: { date: string; status: string; checkInTime: string }[];
  violations: { date: string; categoryName: string; points: number; status: string }[];
}
