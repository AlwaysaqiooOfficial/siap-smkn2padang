import { AppError } from "../middlewares/error.middleware";
import { getAttendanceRules, timeStringToMinutes, nowMinutesOfDay, serverDateOnly } from "../utils/schoolSettings";
import { sendAttendanceEmail } from "./email.service";
import { determineAttendanceStatus } from "../utils/attendanceStatus";
import type { ListAttendanceInput } from "../schemas/attendance.schema";
import { AttendanceRepository, ClassRepository, MajorRepository, SemesterRepository, StudentRepository } from "./repositories";

export interface ScanResult {
  duplicate: boolean;
  student: any;
  status: string;
  punctuality: "CEPAT" | "TEPAT_WAKTU" | "TERLAMBAT" | null;
  checkInTime: Date | null;
  message: string;
}

function getStudentView(student: any) {
  const schoolClass = ClassRepository.findUnique(student.classId);
  const major = MajorRepository.findUnique(student.majorId);
  return {
    ...student,
    class: schoolClass ? { id: schoolClass.id, name: schoolClass.name, grade: schoolClass.grade } : null,
    major: major ? { id: major.id, code: major.code, name: major.name } : null,
  };
}

function getPunctuality(checkInTime: Date | null, startTime: string, lateAfter: string) {
  if (!checkInTime) return null;
  const minutes = nowMinutesOfDay(checkInTime);
  if (minutes < timeStringToMinutes(startTime)) return "CEPAT" as const;
  if (minutes <= timeStringToMinutes(lateAfter)) return "TEPAT_WAKTU" as const;
  return "TERLAMBAT" as const;
}

export async function scanAttendance(token: string, _scannedByUserId: string, _ipAddress?: string): Promise<ScanResult> {
  const rawStudent = StudentRepository.findFirst((item) => item.qrToken === token);
  if (!rawStudent) throw new AppError("QR Code tidak dikenali / tidak valid", 404);
  if (!rawStudent.isActive) throw new AppError(`Siswa ${rawStudent.fullName} berstatus tidak aktif`, 403);

  const semester = SemesterRepository.findFirst((item) => item.isActive);
  if (!semester) throw new AppError("Tidak ada semester aktif. Hubungi admin untuk mengatur semester.", 500);

  const serverNow = new Date();
  const today = serverDateOnly(serverNow);
  const rules = await getAttendanceRules();
  const currentMinutes = nowMinutesOfDay(serverNow);
  if (currentMinutes < timeStringToMinutes(rules.startTime)) {
    throw new AppError(`Scan absensi baru tersedia mulai pukul ${rules.startTime}`, 403);
  }
  if (currentMinutes >= timeStringToMinutes(rules.endTime)) {
    throw new AppError(`Waktu scan sudah berakhir pukul ${rules.endTime}.`, 403);
  }

  const student = getStudentView(rawStudent);
  const existing = AttendanceRepository.findFirst(
    (item) => item.studentId === student.id && item.date === today.toISOString() && item.semesterId === semester.id
  );

  if (existing) {
    const existingTime = existing.checkInTime ? new Date(existing.checkInTime) : null;
    if (existing.status === "ALFA") {
      const status = determineAttendanceStatus(currentMinutes, timeStringToMinutes(rules.lateAfter));
      const updated = await AttendanceRepository.update(existing.id, { status, checkInTime: serverNow.toISOString() });
      void sendAttendanceEmail({
        studentId: student.id,
        studentName: student.fullName,
        className: student.class?.name ?? "-",
        majorName: student.major?.name ?? "-",
        status: status as "HADIR" | "TERLAMBAT",
        checkInTime: serverNow,
        attendanceId: updated.id,
      });
      return {
        duplicate: false,
        student,
        status: updated.status,
        punctuality: getPunctuality(serverNow, rules.startTime, rules.lateAfter),
        checkInTime: serverNow,
        message: status === "HADIR" ? "Absensi berhasil dicatat: HADIR (menggantikan ALFA)" : "Absensi berhasil dicatat: TERLAMBAT (menggantikan ALFA)",
      };
    }
    return {
      duplicate: true,
      student,
      status: existing.status,
      punctuality: getPunctuality(existingTime, rules.startTime, rules.lateAfter),
      checkInTime: existingTime,
      message: existingTime
        ? `Siswa sudah di-scan pada ${existingTime.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })} pukul ${existingTime.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}.`
        : "Siswa sudah di-scan hari ini.",
    };
  }

  const status = determineAttendanceStatus(currentMinutes, timeStringToMinutes(rules.lateAfter));
  const attendance = await AttendanceRepository.create({
    id: crypto.randomUUID(),
    studentId: student.id,
    semesterId: semester.id,
    date: today.toISOString(),
    checkInTime: serverNow.toISOString(),
    status,
    createdAt: serverNow.toISOString(),
    updatedAt: serverNow.toISOString(),
  });

  void sendAttendanceEmail({
    studentId: student.id,
    studentName: student.fullName,
    className: student.class?.name ?? "-",
    majorName: student.major?.name ?? "-",
    status: status as "HADIR" | "TERLAMBAT",
    checkInTime: serverNow,
    attendanceId: attendance.id,
  });

  return {
    duplicate: false,
    student,
    status: attendance.status,
    punctuality: getPunctuality(serverNow, rules.startTime, rules.lateAfter),
    checkInTime: serverNow,
    message: status === "HADIR" ? "Absensi berhasil dicatat: HADIR" : "Absensi berhasil dicatat: TERLAMBAT",
  };
}

export async function listAttendance(filter: ListAttendanceInput, scopedClassId?: string) {
  const date = filter.date ? serverDateOnly(filter.date) : serverDateOnly(new Date());
  const dateKey = date.toISOString();
  let records = AttendanceRepository.findFilter((item) => item.date === dateKey);
  if (filter.status) records = records.filter((item) => item.status === filter.status);
  records = records.filter((item) => {
    const student = StudentRepository.findUnique(item.studentId);
    const classId = scopedClassId ?? filter.classId;
    return !!student && (!classId || student.classId === classId);
  });
  records.sort((a, b) => String(b.checkInTime ?? "").localeCompare(String(a.checkInTime ?? "")));
  const total = records.length;
  const start = (filter.page - 1) * filter.limit;
  const data = records.slice(start, start + filter.limit).map((item) => {
    const student = StudentRepository.findUnique(item.studentId)!;
    return {
      ...item,
      checkInTime: item.checkInTime ? new Date(item.checkInTime) : null,
      student: getStudentView(student),
      semester: SemesterRepository.findUnique(item.semesterId),
    };
  });
  return { data, meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) || 1, date } };
}
