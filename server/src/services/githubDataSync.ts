import { prisma } from "../config/db";
import { env } from "../config/env";
import { githubJsonStore } from "./githubJsonStore";

let syncQueue = Promise.resolve();

function countStatus(attendances: Array<{ status: string }>, status: string) {
  return attendances.filter((attendance) => attendance.status === status).length;
}

async function syncDatabaseToGitHub() {
  if (!env.GITHUB_SYNC_ENABLED || !env.GITHUB_TOKEN) return;

  const [users, teachers, classes, majors, students] = await Promise.all([
    prisma.user.findMany(),
    prisma.teacher.findMany(),
    prisma.class.findMany(),
    prisma.major.findMany(),
    prisma.student.findMany({
      include: {
        parent: { include: { user: { select: { email: true } } } },
        attendances: { select: { status: true, checkInTime: true, date: true }, orderBy: { date: "desc" } },
      },
    }),
  ]);

  const studentsByClass = new Map<string, unknown[]>();
  for (const student of students) {
    const attendances = student.attendances;
    const latestAttendance = attendances[0];
    const data = {
      id: student.id,
      userId: student.userId,
      nis: student.nis,
      nisn: student.nisn,
      fullName: student.fullName,
      gender: student.gender,
      birthDate: student.birthDate,
      address: student.address,
      majorId: student.majorId,
      classId: student.classId,
      parentId: student.parentId,
      qrToken: student.qrToken,
      isActive: student.isActive,
      emailSent: student.emailSent,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      parent: student.parent
        ? {
            id: student.parent.id,
            userId: student.parent.userId,
            fullName: student.parent.fullName,
            email: student.parent.user?.email ?? null,
            phone: student.parent.phone,
            address: student.parent.address,
            createdAt: student.parent.createdAt,
            updatedAt: student.parent.updatedAt,
          }
        : null,
      attendance: {
        totalPresent: countStatus(attendances, "HADIR"),
        totalLate: countStatus(attendances, "TERLAMBAT"),
        totalAbsent: countStatus(attendances, "ALFA"),
        totalSick: countStatus(attendances, "SAKIT"),
        totalPermit: countStatus(attendances, "IZIN"),
        totalDispensation: countStatus(attendances, "DISPENSASI"),
        presentToday: latestAttendance?.status === "HADIR" || latestAttendance?.status === "TERLAMBAT",
        lastPresentAt: latestAttendance?.checkInTime ?? null,
        lastResetAt: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    };

    const classStudents = studentsByClass.get(student.classId) ?? [];
    classStudents.push(data);
    studentsByClass.set(student.classId, classStudents);
  }

  const message = "chore: synchronize application data to GitHub";
  await githubJsonStore.write("users.json", users, message);
  await githubJsonStore.write("teachers.json", teachers, message);
  await githubJsonStore.write("classes.json", classes, message);
  await githubJsonStore.write("majors.json", majors, message);
  for (const schoolClass of classes) {
    await githubJsonStore.write(
      `students/${schoolClass.id}.json`,
      studentsByClass.get(schoolClass.id) ?? [],
      message,
    );
  }
}

export function scheduleGitHubSync() {
  syncQueue = syncQueue
    .then(syncDatabaseToGitHub)
    .catch((error) => console.error("Sinkronisasi otomatis ke GitHub gagal:", error));
}