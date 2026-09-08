import type { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import type { DateRange } from "../utils/dateRange";
import type { ReportFilter } from "../schemas/report.schema";
import type { OverviewReportInput } from "../schemas/report.schema";
import { resolveDailyRange, resolveWeeklyRange, resolveMonthlyRange } from "../utils/dateRange";
import type { ReportMeta, ReportRow, ReportSummary } from "../exporters/types";
import { generateCsvReport } from "../exporters/csv.exporter";
import { generateExcelReport } from "../exporters/excel.exporter";
import { generatePdfReport } from "../exporters/pdf.exporter";

const ALL_STATUSES = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "DISPENSASI", "ALFA"] as const;

export async function buildAttendanceOverview(input: OverviewReportInput, scopedClassId?: string) {
  const range = input.period === "today"
    ? resolveDailyRange()
    : input.period === "week"
      ? resolveWeeklyRange()
      : input.period === "month"
        ? resolveMonthlyRange()
        : await resolveSemesterRange(input.semesterId);

  if (scopedClassId && input.classId && scopedClassId !== input.classId) {
    throw new AppError("Anda tidak memiliki akses ke kelas lain", 403);
  }

  const reportSemester = input.semesterId
    ? { id: input.semesterId }
    : await prisma.semester.findFirst({ where: { isActive: true }, select: { id: true } });

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: range.startDate, lte: range.endDate },
      semesterId: reportSemester?.id,
      student: { classId: scopedClassId ?? input.classId },
    },
    select: {
      status: true,
      checkInTime: true,
      student: { select: { id: true, fullName: true, class: { select: { name: true } } } },
    },
  });

  const counts = Object.fromEntries(ALL_STATUSES.map((status) => [status, 0])) as Record<(typeof ALL_STATUSES)[number], number>;
  const students = new Map<string, { studentId: string; studentName: string; className: string; HADIR: number; TERLAMBAT: number; ALFA: number; firstCheckIn: number | null }>();
  for (const attendance of attendances) {
    counts[attendance.status]++;
    const current = students.get(attendance.student.id) ?? {
      studentId: attendance.student.id,
      studentName: attendance.student.fullName,
      className: attendance.student.class.name,
      HADIR: 0,
      TERLAMBAT: 0,
      ALFA: 0,
      firstCheckIn: null,
    };
    if (attendance.status === "HADIR") current.HADIR++;
    if (attendance.status === "TERLAMBAT") current.TERLAMBAT++;
    if (attendance.status === "ALFA") current.ALFA++;
    if (attendance.checkInTime) {
      const time = attendance.checkInTime.getTime();
      current.firstCheckIn = current.firstCheckIn === null ? time : Math.min(current.firstCheckIn, time);
    }
    students.set(attendance.student.id, current);
  }

  const ranking = [...students.values()];
  const top = (field: "TERLAMBAT" | "HADIR" | "ALFA") => ranking
    .filter((student) => student[field] > 0)
    .sort((a, b) => b[field] - a[field] || (a.firstCheckIn ?? Number.MAX_SAFE_INTEGER) - (b.firstCheckIn ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3)
    .map((student, index) => ({ rank: index + 1, studentId: student.studentId, studentName: student.studentName, className: student.className, total: student[field] }));

  return { period: input.period, periodLabel: range.label, counts, totalStudents: students.size, topLate: top("TERLAMBAT"), topOnTime: top("HADIR"), topAlfa: top("ALFA") };
}

/**
 * Resolusi rentang tanggal laporan semester dari data DB (bukan hitungan kalender manual).
 * Default: semester aktif. Bisa juga memilih semester LAMA secara eksplisit lewat semesterId —
 * datanya tetap tersedia karena attendance semester lampau tidak pernah dihapus.
 */
export async function resolveSemesterRange(semesterId?: string): Promise<DateRange> {
  const semester = semesterId
    ? await prisma.semester.findUnique({ where: { id: semesterId }, include: { academicYear: true } })
    : await prisma.semester.findFirst({ where: { isActive: true }, include: { academicYear: true } });

  if (!semester) {
    throw new AppError(
      semesterId ? "Semester tidak ditemukan" : "Tidak ada semester aktif. Tentukan semesterId secara eksplisit.",
      404
    );
  }

  return {
    startDate: semester.startDate,
    endDate: semester.endDate,
    label: `Semester - ${semester.name} ${semester.academicYear.name}`,
  };
}

export interface ReportQueryResult {
  rows: ReportRow[];
  summary: ReportSummary;
  meta: ReportMeta;
}

/**
 * Query data attendance NYATA dari database sesuai rentang tanggal + filter, dengan scope role
 * dihormati (WALI_KELAS dipaksa ke kelasnya). Rentang tanggal TIDAK dibatasi ke semester aktif
 * saja — data attendance semester lampau tetap dapat dilaporkan karena tidak pernah dihapus.
 */
async function queryAttendanceRows(
  range: DateRange,
  filter: ReportFilter,
  scopedClassId?: string
) {
  if (scopedClassId && filter.classId && filter.classId !== scopedClassId) {
    throw new AppError("Anda tidak memiliki akses ke kelas di luar kelas Anda", 403);
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  const where: Prisma.AttendanceWhereInput = {
    date: { gte: range.startDate, lte: range.endDate },
    semesterId: activeSemester?.id,
    status: filter.status,
    studentId: filter.studentId,
    student: {
      classId: scopedClassId ?? filter.classId,
      majorId: filter.majorId,
    },
  };

  return prisma.attendance.findMany({
    where,
    include: {
      student: {
        select: {
          nis: true,
          nisn: true,
          fullName: true,
          class: { select: { name: true } },
          major: { select: { code: true } },
        },
      },
    },
    orderBy: [{ date: "asc" }, { student: { fullName: "asc" } }],
  });
}

function toReportRows(
  attendances: Awaited<ReturnType<typeof queryAttendanceRows>>
): ReportRow[] {
  return attendances.map((a, idx) => ({
    no: idx + 1,
    nis: a.student.nis,
    nisn: a.student.nisn,
    studentName: a.student.fullName,
    className: a.student.class.name,
    majorCode: a.student.major.code,
    date: a.date.toLocaleDateString("id-ID"),
    status: a.status,
    checkInTime: a.checkInTime
      ? a.checkInTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-",
  }));
}

function buildSummary(rows: ReportRow[]): ReportSummary {
  const byStatus: Record<string, number> = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }
  return { totalRecords: rows.length, byStatus };
}

async function buildFilterLabel(filter: ReportFilter): Promise<string> {
  const parts: string[] = [];

  if (filter.majorId) {
    const major = await prisma.major.findUnique({ where: { id: filter.majorId } });
    if (major) parts.push(`Jurusan: ${major.name}`);
  }
  if (filter.classId) {
    const kelas = await prisma.class.findUnique({ where: { id: filter.classId } });
    if (kelas) parts.push(`Kelas: ${kelas.name}`);
  }
  if (filter.studentId) {
    const student = await prisma.student.findUnique({ where: { id: filter.studentId } });
    if (student) parts.push(`Siswa: ${student.fullName}`);
  }
  if (filter.status) {
    parts.push(`Status: ${filter.status}`);
  }

  return parts.length > 0 ? parts.join(", ") : "Semua data (tanpa filter tambahan)";
}

export async function buildAttendanceReport(
  range: DateRange,
  filter: ReportFilter,
  generatedBy: string,
  scopedClassId?: string
): Promise<ReportQueryResult> {
  const attendances = await queryAttendanceRows(range, filter, scopedClassId);
  const rows = toReportRows(attendances);
  const summary = buildSummary(rows);
  const filterLabel = await buildFilterLabel(filter);

  const meta: ReportMeta = {
    title: "Laporan Absensi Siswa",
    periodLabel: range.label,
    generatedAt: new Date(),
    generatedBy,
    filterLabel,
  };

  return { rows, summary, meta };
}

export async function exportReport(
  format: "excel" | "pdf" | "csv",
  result: ReportQueryResult
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const safeLabel = result.meta.periodLabel.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60);

  if (format === "csv") {
    return {
      buffer: generateCsvReport(result.rows),
      contentType: "text/csv; charset=utf-8",
      filename: `laporan-absensi-${safeLabel}.csv`,
    };
  }

  if (format === "excel") {
    const buffer = await generateExcelReport(result.rows, result.meta, result.summary);
    return {
      buffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `laporan-absensi-${safeLabel}.xlsx`,
    };
  }

  const buffer = await generatePdfReport(result.rows, result.meta, result.summary);
  return { buffer, contentType: "application/pdf", filename: `laporan-absensi-${safeLabel}.pdf` };
}
