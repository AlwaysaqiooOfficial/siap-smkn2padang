import { AppError } from "../middlewares/error.middleware";
import type { DateRange } from "../utils/dateRange";
import type { ReportFilter, OverviewReportInput } from "../schemas/report.schema";
import { resolveDailyRange, resolveWeeklyRange, resolveMonthlyRange } from "../utils/dateRange";
import type { ReportMeta, ReportRow, ReportSummary } from "../exporters/types";
import { generateCsvReport } from "../exporters/csv.exporter";
import { generateExcelReport } from "../exporters/excel.exporter";
import { generatePdfReport } from "../exporters/pdf.exporter";
import { AttendanceRepository, ClassRepository, MajorRepository, SemesterRepository, StudentRepository } from "./repositories";

const ALL_STATUSES = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "DISPENSASI", "ALFA"] as const;
const key = (date: Date | string) => new Date(date).toISOString().slice(0, 10);

export async function resolveSemesterRange(semesterId?: string): Promise<DateRange> {
  const semester = semesterId ? SemesterRepository.findUnique(semesterId) : SemesterRepository.findFirst((item) => item.isActive);
  if (!semester) throw new AppError(semesterId ? "Semester tidak ditemukan" : "Tidak ada semester aktif", 404);
  return { startDate: new Date(semester.startDate), endDate: new Date(semester.endDate), label: `Semester - ${semester.name}` };
}

function recordsInRange(range: DateRange, filter: ReportFilter, scopedClassId?: string) {
  if (scopedClassId && filter.classId && filter.classId !== scopedClassId) throw new AppError("Anda tidak memiliki akses ke kelas di luar kelas Anda", 403);
  return AttendanceRepository.findFilter((item) => {
    const date = new Date(item.date); const student = StudentRepository.findUnique(item.studentId); if (!student) return false;
    return date >= range.startDate && date <= range.endDate && (!filter.status || item.status === filter.status) && (!filter.studentId || item.studentId === filter.studentId) && (!filter.majorId || student.majorId === filter.majorId) && (!scopedClassId && !filter.classId || student.classId === (scopedClassId ?? filter.classId));
  });
}

function toRows(records: any[]): ReportRow[] {
  return records.sort((a, b) => a.date.localeCompare(b.date)).map((item, index) => { const student = StudentRepository.findUnique(item.studentId)!; const schoolClass = ClassRepository.findUnique(student.classId); const major = MajorRepository.findUnique(student.majorId); return { no: index + 1, nis: student.nis, nisn: student.nisn, studentName: student.fullName, className: schoolClass?.name ?? "-", majorCode: major?.code ?? "-", date: new Date(item.date).toLocaleDateString("id-ID"), status: item.status, checkInTime: item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-" }; });
}

function summary(rows: ReportRow[]): ReportSummary { const byStatus: Record<string, number> = Object.fromEntries(ALL_STATUSES.map((status) => [status, 0])); for (const row of rows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1; return { totalRecords: rows.length, byStatus }; }

export async function buildAttendanceOverview(input: OverviewReportInput, scopedClassId?: string) {
  const range = input.period === "today" ? resolveDailyRange() : input.period === "week" ? resolveWeeklyRange() : input.period === "month" ? resolveMonthlyRange() : await resolveSemesterRange(input.semesterId);
  const records = recordsInRange(range, input as any, scopedClassId); const counts: any = Object.fromEntries(ALL_STATUSES.map((status) => [status, 0])); const grouped = new Map<string, any>();
  for (const item of records) { counts[item.status]++; const student = StudentRepository.findUnique(item.studentId)!; const schoolClass = ClassRepository.findUnique(student.classId); const row = grouped.get(student.id) ?? { studentId: student.id, studentName: student.fullName, className: schoolClass?.name ?? "-", HADIR: 0, TERLAMBAT: 0, ALFA: 0, firstCheckIn: null }; if (item.status in row) row[item.status]++; if (item.checkInTime) row.firstCheckIn = row.firstCheckIn === null ? new Date(item.checkInTime).getTime() : Math.min(row.firstCheckIn, new Date(item.checkInTime).getTime()); grouped.set(student.id, row); }
  const top = (field: "TERLAMBAT" | "HADIR" | "ALFA") => [...grouped.values()].filter((item) => item[field] > 0).sort((a, b) => b[field] - a[field]).slice(0, 3).map((item, index) => ({ rank: index + 1, studentId: item.studentId, studentName: item.studentName, className: item.className, total: item[field] }));
  return { period: input.period, periodLabel: range.label, counts, totalStudents: grouped.size, topLate: top("TERLAMBAT"), topOnTime: top("HADIR"), topAlfa: top("ALFA") };
}

export interface ReportQueryResult { rows: ReportRow[]; summary: ReportSummary; meta: ReportMeta; }
export async function buildAttendanceReport(range: DateRange, filter: ReportFilter, generatedBy: string, scopedClassId?: string): Promise<ReportQueryResult> { const rows = toRows(recordsInRange(range, filter, scopedClassId)); const filterLabel = filter.status ? `Status: ${filter.status}` : "Semua data (tanpa filter tambahan)"; return { rows, summary: summary(rows), meta: { title: "Laporan Absensi Siswa", periodLabel: range.label, generatedAt: new Date(), generatedBy, filterLabel } }; }
export async function exportReport(format: "excel" | "pdf" | "csv", result: ReportQueryResult) { const safeLabel = result.meta.periodLabel.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60); if (format === "csv") return { buffer: generateCsvReport(result.rows), contentType: "text/csv; charset=utf-8", filename: `laporan-absensi-${safeLabel}.csv` }; if (format === "excel") return { buffer: await generateExcelReport(result.rows, result.meta, result.summary), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: `laporan-absensi-${safeLabel}.xlsx` }; return { buffer: await generatePdfReport(result.rows, result.meta, result.summary), contentType: "application/pdf", filename: `laporan-absensi-${safeLabel}.pdf` }; }
