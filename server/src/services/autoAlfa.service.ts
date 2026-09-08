import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { serverDateOnly } from "../utils/schoolSettings";
import { notifyParentOfStudent } from "./notification.service";
import { sendAutoAlfaEmail } from "./email.service";
import { logger } from "../utils/logger";

export interface AutoAlfaResult {
  processed: number;
  skipped: number;
  totalCandidates: number;
  date: string;
}

/**
 * Menandai ALFA siswa aktif yang, per waktu SERVER saat job dijalankan:
 * - belum memiliki attendance hari ini pada semester aktif
 * - TIDAK memiliki pengajuan izin/sakit/dispensasi berstatus APPROVED hari ini
 *
 * Idempotent: karena attendance punya unique constraint (studentId, date, semesterId),
 * menjalankan job ini berkali-kali pada hari yang sama tidak akan pernah membuat data ganda —
 * siswa yang sudah punya attendance (dari scan, izin, ATAU proses ALFA sebelumnya) otomatis
 * ter-filter dari daftar kandidat.
 */
export async function runAutoAlfaJob(): Promise<AutoAlfaResult> {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!activeSemester) {
    logger.warn("[auto-alfa] Dilewati: tidak ada semester aktif");
    return { processed: 0, skipped: 0, totalCandidates: 0, date: new Date().toISOString() };
  }

  const today = serverDateOnly(new Date());

  // Siswa aktif yang PADA HARI INI sudah punya pengajuan APPROVED -> dikecualikan.
  const approvedStudentIds = (
    await prisma.permission.findMany({
      where: { date: today, status: "APPROVED" },
      select: { studentId: true },
    })
  ).map((p) => p.studentId);

  // Kandidat: siswa aktif tanpa attendance hari ini pada semester aktif.
  const candidates = await prisma.student.findMany({
    where: {
      isActive: true,
      id: { notIn: approvedStudentIds },
      attendances: {
        none: { date: today, semesterId: activeSemester.id },
      },
    },
    select: {
      id: true,
      fullName: true,
      class: { select: { name: true } },
      major: { select: { name: true } },
    },
  });

  let processed = 0;
  let skipped = 0;

  for (const student of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const attendance = await prisma.$transaction(async (tx) => {
        const inserted = await tx.attendance.createMany({
          data: {
            studentId: student.id,
            semesterId: activeSemester.id,
            date: today,
            status: "ALFA",
            checkInTime: null,
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
            action: "AUTO_ALFA",
            performedBy: null, // dijalankan sistem/cron, bukan user
            note: "Ditandai ALFA otomatis oleh scheduled job (tidak ada scan & tidak ada izin approved)",
          },
        });
        return created;
      });

      if (!attendance) {
        skipped++;
        continue;
      }

      processed++;

      // eslint-disable-next-line no-await-in-loop
      await notifyParentOfStudent(
        student.id,
        "Informasi Kehadiran: ALFA",
        `${student.fullName} tercatat ALFA hari ini (${today.toLocaleDateString("id-ID")}) karena tidak melakukan absensi dan tidak ada izin yang disetujui.`
      );

      void sendAutoAlfaEmail({
        studentId: student.id,
        studentName: student.fullName,
        className: student.class.name,
        majorName: student.major.name,
        date: today,
        attendanceId: attendance.id,
      });
    } catch (err) {
      // Race condition: siswa sempat scan / izin disetujui tepat saat job berjalan -> unique constraint bentrok.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        skipped++;
        continue;
      }
      logger.error(`[auto-alfa] Gagal memproses siswa ${student.id}:`, err);
      skipped++;
    }
  }

  logger.info(
    `[auto-alfa] Selesai. Kandidat: ${candidates.length}, diproses: ${processed}, dilewati: ${skipped}`
  );

  return {
    processed,
    skipped,
    totalCandidates: candidates.length,
    date: today.toISOString(),
  };
}
