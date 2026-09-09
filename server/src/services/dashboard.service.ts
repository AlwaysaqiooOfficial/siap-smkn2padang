import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly } from "../utils/schoolSettings";
import { generateQrImage } from "../utils/qrImage";
import { AttendanceRepository, ClassRepository, MajorRepository, SemesterRepository, StudentRepository, TeacherRepository, ViolationRepository, ViolationCategoryRepository } from "./repositories";

const EMPTY_STATUS_COUNTS = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, DISPENSASI: 0, ALFA: 0 };
function addDays(date: Date, days: number) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function dayKey(date: Date) { return serverDateOnly(date).toISOString(); }
function studentView(student: any) { const schoolClass = ClassRepository.findUnique(student.classId); const major = MajorRepository.findUnique(student.majorId); return { ...student, class: schoolClass, major }; }
function countStatuses(records: any[]) { const counts = { ...EMPTY_STATUS_COUNTS }; for (const record of records) if (record.status in counts) counts[record.status as keyof typeof counts]++; return counts; }

export function getScannerDashboard() {
  const today = dayKey(new Date());
  const semester = SemesterRepository.findFirst((item) => item.isActive);
  const records = semester ? AttendanceRepository.findFilter((item) => item.date === today && item.semesterId === semester.id) : [];
  return { date: today, counts: countStatuses(records) };
}

export function getAdminDashboard() {
  const today = dayKey(new Date());
  const semester = SemesterRepository.findFirst((item) => item.isActive);
  const records = semester ? AttendanceRepository.findFilter((item) => item.date === today && item.semesterId === semester.id) : [];
  const todayCounts = countStatuses(records);
  const byMajor = new Map<string, any>(); const byClass = new Map<string, any>();
  for (const record of records) {
    const student = StudentRepository.findUnique(record.studentId); if (!student) continue;
    const major = MajorRepository.findUnique(student.majorId); const schoolClass = ClassRepository.findUnique(student.classId);
    if (major) { const row = byMajor.get(major.id) ?? { majorCode: major.code, majorName: major.name, ...EMPTY_STATUS_COUNTS }; if (record.status in row) row[record.status]++; byMajor.set(major.id, row); }
    if (schoolClass) { const row = byClass.get(schoolClass.id) ?? { className: schoolClass.name, ...EMPTY_STATUS_COUNTS }; if (record.status in row) row[record.status]++; byClass.set(schoolClass.id, row); }
  }
  const trendStart = addDays(new Date(), -13); const trend = [];
  for (let index = 0; index < 14; index++) { const date = dayKey(addDays(trendStart, index)); const daily = semester ? AttendanceRepository.findFilter((item) => item.date === date && item.semesterId === semester.id) : []; trend.push({ date, ...countStatuses(daily) }); }
  const grouped = (status: string) => { const map = new Map<string, number>(); for (const record of semester ? AttendanceRepository.findFilter((item) => item.semesterId === semester.id && item.status === status) : []) map.set(record.studentId, (map.get(record.studentId) ?? 0) + 1); return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([studentId, count]) => { const student = StudentRepository.findUnique(studentId); return { studentId, studentName: student?.fullName ?? "-", className: student ? ClassRepository.findUnique(student.classId)?.name ?? "-" : "-", count }; }); };
  return { totals: { totalStudents: StudentRepository.count((item) => item.isActive), totalTeachers: TeacherRepository.findMany().length, totalClasses: ClassRepository.findMany().length }, todayCounts, chartsByMajor: [...byMajor.values()], chartsByClass: [...byClass.values()], trend, topAlfa: grouped("ALFA"), topTerlambat: grouped("TERLAMBAT") };
}

export interface WaliKelasDashboardFilter { date?: string; status?: string; search?: string; }
export function getWaliKelasDashboard(classId: string, filter: WaliKelasDashboardFilter) {
  const date = dayKey(filter.date ? new Date(filter.date) : new Date()); const semester = SemesterRepository.findFirst((item) => item.isActive); const schoolClass = ClassRepository.findUnique(classId); if (!schoolClass) throw new AppError("Kelas tidak ditemukan", 404);
  const major = MajorRepository.findUnique(schoolClass.majorId); let students = StudentRepository.findFilter((item) => item.classId === classId && item.isActive); if (filter.search) students = students.filter((item) => item.fullName.toLowerCase().includes(filter.search!.toLowerCase()));
  const records = semester ? AttendanceRepository.findFilter((item) => item.date === date && item.semesterId === semester.id && students.some((student) => student.id === item.studentId)) : []; const counts = countStatuses(records); const map = new Map(records.map((item) => [item.studentId, item]));
  let rows = students.sort((a, b) => a.fullName.localeCompare(b.fullName)).map((student, index) => { const attendance = map.get(student.id); return { no: index + 1, nis: student.nis, fullName: student.fullName, status: attendance?.status ?? "BELUM ABSEN", checkInTime: attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-" }; }); if (filter.status) rows = rows.filter((row) => row.status === filter.status);
  return { classInfo: { id: schoolClass.id, name: schoolClass.name, majorName: major?.name ?? "-" }, date, totalStudents: students.length, counts, attendancePercentage: students.length ? Math.round(((counts.HADIR + counts.TERLAMBAT) / students.length) * 1000) / 10 : 0, students: rows };
}

export function getGuruDashboard(teacherId: string, _userId: string) {
  const teacher = TeacherRepository.findUnique(teacherId); const violations = ViolationRepository.findFilter((item) => item.teacherId === teacherId); return { teacherName: teacher?.fullName ?? "-", todayScanCount: 0, totalViolationsReported: violations.length, recentViolations: violations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((item) => { const result: any = { ...item, student: studentView(StudentRepository.findUnique(item.studentId)), category: ViolationCategoryRepository.findUnique(item.categoryId ?? item.violationCategoryId) }; return { id: item.id, studentName: result.student?.fullName ?? "-", className: result.student?.class?.name ?? "-", categoryName: result.category?.name ?? "-", points: item.points ?? item.point, status: item.status, date: new Date(item.date).toLocaleDateString("id-ID") }; }) };
}

export async function getSiswaDashboard(studentId: string) {
  const student = StudentRepository.findUnique(studentId); if (!student) throw new AppError("Data siswa tidak ditemukan", 404); const semester = SemesterRepository.findFirst((item) => item.isActive); const records = AttendanceRepository.findFilter((item) => item.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)); const today = dayKey(new Date()); const todayAttendance = semester ? records.find((item) => item.date === today && item.semesterId === semester.id) : undefined; const qrImage = await generateQrImage(student.qrToken); const enriched = studentView(student);
  return { profile: { fullName: student.fullName, nis: student.nis, nisn: student.nisn, className: enriched.class?.name ?? "-", majorName: enriched.major?.name ?? "-" }, qrImage, todayStatus: todayAttendance?.status ?? "BELUM ABSEN", history: records.slice(0, 30).map((item) => ({ date: new Date(item.date).toLocaleDateString("id-ID"), status: item.status, checkInTime: item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-" })) };
}

export async function getOrangTuaDashboard(parentId: string) {
  const children = StudentRepository.findFilter((item) => item.parentId === parentId); const semester = SemesterRepository.findFirst((item) => item.isActive); const today = dayKey(new Date());
  return Promise.all(children.map(async (child) => { const records = AttendanceRepository.findFilter((item) => item.studentId === child.id).sort((a, b) => b.date.localeCompare(a.date)); const todayAttendance = semester ? records.find((item) => item.date === today && item.semesterId === semester.id) : undefined; const enriched = studentView(child); const violations = ViolationRepository.findFilter((item) => item.studentId === child.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10); return { studentId: child.id, fullName: child.fullName, className: enriched.class?.name ?? "-", majorName: enriched.major?.name ?? "-", todayStatus: todayAttendance?.status ?? "BELUM ABSEN", history: records.slice(0, 30).map((item) => ({ date: new Date(item.date).toLocaleDateString("id-ID"), status: item.status, checkInTime: item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-" })), violations: violations.map((item) => ({ date: new Date(item.date).toLocaleDateString("id-ID"), categoryName: ViolationCategoryRepository.findUnique(item.categoryId ?? item.violationCategoryId)?.name ?? "-", points: item.points ?? item.point, status: item.status })) }; }));
}
