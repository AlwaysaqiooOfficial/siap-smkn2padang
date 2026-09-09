import { serverDateOnly } from "../utils/schoolSettings";
import { sendAutoAlfaEmail } from "./email.service";
import { notifyParentOfStudent } from "./notification.service";
import { AttendanceRepository, PermissionRepository, SemesterRepository, StudentRepository, ClassRepository, MajorRepository } from "./repositories";

export interface AutoAlfaResult { processed: number; skipped: number; totalCandidates: number; date: string; }

export async function runAutoAlfaJob(): Promise<AutoAlfaResult> {
  const semester = SemesterRepository.findFirst((item) => item.isActive);
  const today = serverDateOnly(new Date()).toISOString();
  if (!semester) return { processed: 0, skipped: 0, totalCandidates: 0, date: today };
  const approved = new Set(PermissionRepository.findFilter((item) => item.date === today && item.status === "APPROVED").map((item) => item.studentId));
  const candidates = StudentRepository.findFilter((student) => student.isActive && !approved.has(student.id) && !AttendanceRepository.findFirst((item) => item.studentId === student.id && item.date === today && item.semesterId === semester.id));
  let processed = 0;
  for (const student of candidates) {
    const now = new Date().toISOString();
    const attendance = await AttendanceRepository.create({ id: crypto.randomUUID(), studentId: student.id, semesterId: semester.id, date: today, checkInTime: null, status: "ALFA", createdAt: now, updatedAt: now });
    const schoolClass = ClassRepository.findUnique(student.classId);
    const major = MajorRepository.findUnique(student.majorId);
    void notifyParentOfStudent(student.id, "Siswa Tidak Hadir", `${student.fullName} tercatat ALFA hari ini.`);
    void sendAutoAlfaEmail({ studentId: student.id, studentName: student.fullName, className: schoolClass?.name ?? "-", majorName: major?.name ?? "-", date: new Date(today), attendanceId: attendance.id });
    processed++;
  }
  return { processed, skipped: 0, totalCandidates: candidates.length, date: today };
}
