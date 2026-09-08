import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import {
  getAttendanceRules,
  timeStringToMinutes,
  nowMinutesOfDay,
  serverDateOnly,
} from "../utils/schoolSettings";
import { sendAttendanceEmail } from "./email.service";
import { determineAttendanceStatus } from "../utils/attendanceStatus";
import type { ListAttendanceInput } from "../schemas/attendance.schema";

const studentSelect = {
  id: true,
  nis: true,
  nisn: true,
  fullName: true,
  isActive: true,
  class: { select: { id: true, name: true, grade: true } },
  major: { select: { id: true, code: true, name: true } },
};

export interface ScanResult {
  duplicate: boolean;
  student: {
    id: string;
    nis: string;
    nisn: string;
    fullName: string;
    class: { id: string; name: string; grade: number };
    major: { id: string; code: string; name: string };
  };
  status: string;
  punctuality: "CEPAT" | "TEPAT_WAKTU" | "TERLAMBAT" | null;
  checkInTime: Date | null;
  message: string;
}

function getPunctuality(checkInTime: Date | null, startTime: string, lateAfter: string) {
  if (!checkInTime) return null;
  const minutes = nowMinutesOfDay(checkInTime);
  if (minutes < timeStringToMinutes(startTime)) return "CEPAT" as const;
  if (minutes <= timeStringToMinutes(lateAfter)) return "TEPAT_WAKTU" as const;
  return "TERLAMBAT" as const;
}

/**
 * Alur scan QR (SEMUA berdasarkan waktu SERVER, bukan waktu dari browser/klien):
 * 1. baca token -> 2. validasi token -> 3. cari siswa -> 4. cek aktif -> 5. ambil kelas
 * 6. ambil tahun ajaran & semester aktif -> 7-8. tanggal & waktu server
 * 9. cek sudah absen hari ini -> 10. tentukan status -> 11-12. simpan attendance + log
 */
export async function scanAttendance(
  token: string,
  scannedByUserId: string,
  ipAddress?: string
): Promise<ScanResult> {
  // 1-2. Validasi token & cari siswa
  const student = await prisma.student.findUnique({
    where: { qrToken: token },
    select: studentSelect,
  });

  if (!student) {
    throw new AppError("QR Code tidak dikenali / tidak valid", 404);
  }

  // 4. Cek siswa aktif
  if (!student.isActive) {
    throw new AppError(`Siswa ${student.fullName} berstatus tidak aktif`, 403);
  }

  // 6. Ambil semester aktif
  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true },
  });
  if (!activeSemester) {
    throw new AppError("Tidak ada semester aktif. Hubungi admin untuk mengatur semester.", 500);
  }

  // 7-8. Waktu SERVER (bukan dari request/browser)
  const serverNow = new Date();
  const today = serverDateOnly(serverNow);
  const rules = await getAttendanceRules();
  const currentMinutes = nowMinutesOfDay(serverNow);
  const startMinutes = timeStringToMinutes(rules.startTime);
  const endMinutes = timeStringToMinutes(rules.endTime);

  if (currentMinutes < startMinutes) {
    throw new AppError(`Scan absensi baru tersedia mulai pukul ${rules.startTime}`, 403);
  }

  if (currentMinutes >= endMinutes) {
    throw new AppError(
      `Waktu scan sudah berakhir pukul ${rules.endTime}. Siswa tercatat ALFA jika belum absen.`,
      403
    );
  }

  // 9. Cek duplicate scan
  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_date_semesterId: {
        studentId: student.id,
        date: today,
        semesterId: activeSemester.id,
      },
    },
  });

  if (existing) {
    if (existing.status === "ALFA") {
      const lateAfterMinutes = timeStringToMinutes(rules.lateAfter);
      const status = determineAttendanceStatus(currentMinutes, lateAfterMinutes);
      const updated = await prisma.$transaction(async (tx) => {
        const attendance = await tx.attendance.update({
          where: { id: existing.id },
          data: { status, checkInTime: serverNow },
        });

        await tx.attendanceLog.create({
          data: {
            attendanceId: attendance.id,
            action: "SCAN",
            performedBy: scannedByUserId,
            ipAddress,
            note: `Status ALFA diperbarui melalui scan QR: ${status}`,
          },
        });

        return attendance;
      });

      void sendAttendanceEmail({
        studentId: student.id,
        studentName: student.fullName,
        className: student.class.name,
        majorName: student.major.name,
        status,
        checkInTime: updated.checkInTime!,
        attendanceId: updated.id,
      });

      return {
        duplicate: false,
        student,
        status: updated.status,
        punctuality: getPunctuality(updated.checkInTime, rules.startTime, rules.lateAfter),
        checkInTime: updated.checkInTime,
        message:
          status === "HADIR"
            ? "Absensi berhasil dicatat: HADIR (menggantikan ALFA)"
            : "Absensi berhasil dicatat: TERLAMBAT (menggantikan ALFA)",
      };
    }

    return {
      duplicate: true,
      student,
      status: existing.status,
      punctuality: getPunctuality(existing.checkInTime, rules.startTime, rules.lateAfter),
      checkInTime: existing.checkInTime,
      message: "Absensi hari ini sudah tercatat.",
    };
  }

  // 10. Tentukan status berdasarkan school_settings
  const lateAfterMinutes = timeStringToMinutes(rules.lateAfter);
  const status = determineAttendanceStatus(currentMinutes, lateAfterMinutes);

  // 11-12. Simpan attendance + attendance_logs tanpa melempar error saat scan bersamaan.
  const attendance = await prisma.$transaction(async (tx) => {
    const inserted = await tx.attendance.createMany({
      data: {
        studentId: student.id,
        semesterId: activeSemester.id,
        date: today,
        checkInTime: serverNow,
        status,
      },
      skipDuplicates: true,
    });

    if (inserted.count === 0) return null;

    const created = await tx.attendance.findUniqueOrThrow({
      where: {
        studentId_date_semesterId: {
          studentId: student.id,
          date: today,
          semesterId: activeSemester.id,
        },
      },
    });

    await tx.attendanceLog.create({
      data: {
        attendanceId: created.id,
        action: "SCAN",
        performedBy: scannedByUserId,
        ipAddress,
        note: `Scan QR oleh guru, status otomatis: ${status}`,
      },
    });

    return created;
  });

  if (!attendance) {
    const duplicate = await prisma.attendance.findUnique({
      where: {
        studentId_date_semesterId: {
          studentId: student.id,
          date: today,
          semesterId: activeSemester.id,
        },
      },
    });

    return {
      duplicate: true,
      student,
      status: duplicate?.status ?? status,
      punctuality: getPunctuality(duplicate?.checkInTime ?? null, rules.startTime, rules.lateAfter),
      checkInTime: duplicate?.checkInTime ?? null,
      message: "Absensi hari ini sudah tercatat.",
    };
  }

  // Email dikirim setelah transaksi commit agar kegagalan email tidak membatalkan absensi.
  void sendAttendanceEmail({
    studentId: student.id,
    studentName: student.fullName,
    className: student.class.name,
    majorName: student.major.name,
    status: status as "HADIR" | "TERLAMBAT",
    checkInTime: attendance.checkInTime!,
    attendanceId: attendance.id,
  });

  return {
    duplicate: false,
    student,
    status: attendance.status,
    punctuality: getPunctuality(attendance.checkInTime, rules.startTime, rules.lateAfter),
    checkInTime: attendance.checkInTime,
    message:
      status === "HADIR" ? "Absensi berhasil dicatat: HADIR" : "Absensi berhasil dicatat: TERLAMBAT",
  };
}

export async function listAttendance(filter: ListAttendanceInput, scopedClassId?: string) {
  const date = filter.date ? serverDateOnly(filter.date) : serverDateOnly(new Date());

  const where: Prisma.AttendanceWhereInput = {
    date,
    status: filter.status,
    student: {
      classId: scopedClassId ?? filter.classId,
    },
  };

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: { select: studentSelect },
        semester: { select: { id: true, name: true } },
      },
      orderBy: { checkInTime: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.ceil(total / filter.limit) || 1,
      date,
    },
  };
}
