import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly } from "../utils/schoolSettings";
import { generateQrImage } from "../utils/qrImage";

const EMPTY_STATUS_COUNTS = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, DISPENSASI: 0, ALFA: 0 };

export async function getScannerDashboard() {
  const today = serverDateOnly(new Date());
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  const counts = { ...EMPTY_STATUS_COUNTS };
  if (!activeSemester) return { date: today.toISOString().slice(0, 10), counts };

  const attendances = await prisma.attendance.findMany({
    where: { date: today, semesterId: activeSemester.id },
    select: { status: true },
  });
  for (const attendance of attendances) {
    counts[attendance.status as keyof typeof counts]++;
  }
  return { date: today.toISOString().slice(0, 10), counts };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

export async function getAdminDashboard() {
  const today = serverDateOnly(new Date());
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.teacher.count(),
    prisma.class.count(),
  ]);

  const todayAttendances = activeSemester
    ? await prisma.attendance.findMany({
        where: { date: today, semesterId: activeSemester.id },
        select: {
          status: true,
          student: {
            select: {
              class: { select: { id: true, name: true } },
              major: { select: { id: true, code: true, name: true } },
            },
          },
        },
      })
    : [];

  const todayCounts = { ...EMPTY_STATUS_COUNTS };
  const byMajorMap = new Map<string, { majorCode: string; majorName: string } & typeof EMPTY_STATUS_COUNTS>();
  const byClassMap = new Map<string, { className: string } & typeof EMPTY_STATUS_COUNTS>();

  for (const a of todayAttendances) {
    todayCounts[a.status as keyof typeof EMPTY_STATUS_COUNTS]++;

    const majorKey = a.student.major.id;
    if (!byMajorMap.has(majorKey)) {
      byMajorMap.set(majorKey, {
        majorCode: a.student.major.code,
        majorName: a.student.major.name,
        ...EMPTY_STATUS_COUNTS,
      });
    }
    byMajorMap.get(majorKey)![a.status as keyof typeof EMPTY_STATUS_COUNTS]++;

    const classKey = a.student.class.id;
    if (!byClassMap.has(classKey)) {
      byClassMap.set(classKey, { className: a.student.class.name, ...EMPTY_STATUS_COUNTS });
    }
    byClassMap.get(classKey)![a.status as keyof typeof EMPTY_STATUS_COUNTS]++;
  }

  // Trend 14 hari terakhir
  const trendStart = addDays(today, -13);
  const trendAttendances = activeSemester
    ? await prisma.attendance.findMany({
        where: { date: { gte: trendStart, lte: today }, semesterId: activeSemester.id },
        select: { date: true, status: true },
      })
    : [];

  const trendMap = new Map<string, typeof EMPTY_STATUS_COUNTS>();
  for (let i = 0; i < 14; i++) {
    const d = addDays(trendStart, i);
    trendMap.set(d.toISOString().slice(0, 10), { ...EMPTY_STATUS_COUNTS });
  }
  for (const a of trendAttendances) {
    const key = a.date.toISOString().slice(0, 10);
    const bucket = trendMap.get(key);
    if (bucket) bucket[a.status as keyof typeof EMPTY_STATUS_COUNTS]++;
  }
  const trend = Array.from(trendMap.entries()).map(([date, counts]) => ({ date, ...counts }));

  // Top 5 siswa dengan ALFA & TERLAMBAT terbanyak (semester aktif)
  const [topAlfaGroups, topTerlambatGroups] = activeSemester
    ? await Promise.all([
        prisma.attendance.groupBy({
          by: ["studentId"],
          where: { status: "ALFA", semesterId: activeSemester.id },
          _count: { studentId: true },
          orderBy: { _count: { studentId: "desc" } },
          take: 5,
        }),
        prisma.attendance.groupBy({
          by: ["studentId"],
          where: { status: "TERLAMBAT", semesterId: activeSemester.id },
          _count: { studentId: true },
          orderBy: { _count: { studentId: "desc" } },
          take: 5,
        }),
      ])
    : [[], []];

  async function withStudentNames(groups: { studentId: string; _count: { studentId: number } }[]) {
    const students = await prisma.student.findMany({
      where: { id: { in: groups.map((g) => g.studentId) } },
      select: { id: true, fullName: true, class: { select: { name: true } } },
    });
    const map = new Map(students.map((s) => [s.id, s]));
    return groups.map((g) => ({
      studentId: g.studentId,
      studentName: map.get(g.studentId)?.fullName ?? "-",
      className: map.get(g.studentId)?.class.name ?? "-",
      count: g._count.studentId,
    }));
  }

  const [topAlfa, topTerlambat] = await Promise.all([
    withStudentNames(topAlfaGroups),
    withStudentNames(topTerlambatGroups),
  ]);

  return {
    totals: { totalStudents, totalTeachers, totalClasses },
    todayCounts,
    chartsByMajor: Array.from(byMajorMap.values()),
    chartsByClass: Array.from(byClassMap.values()),
    trend,
    topAlfa,
    topTerlambat,
  };
}

// ------------------------------------------------------------
// WALI KELAS
// ------------------------------------------------------------

export interface WaliKelasDashboardFilter {
  date?: string;
  status?: string;
  search?: string;
}

export async function getWaliKelasDashboard(classId: string, filter: WaliKelasDashboardFilter) {
  const date = serverDateOnly(filter.date ? new Date(filter.date) : new Date());
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const kelas = await prisma.class.findUnique({
    where: { id: classId },
    include: { major: { select: { name: true } } },
  });
  if (!kelas) throw new AppError("Kelas tidak ditemukan", 404);

  const students = await prisma.student.findMany({
    where: {
      classId,
      isActive: true,
      fullName: filter.search ? { contains: filter.search } : undefined,
    },
    select: { id: true, nis: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const attendances = activeSemester
    ? await prisma.attendance.findMany({
        where: { date, semesterId: activeSemester.id, studentId: { in: students.map((s) => s.id) } },
        select: { studentId: true, status: true, checkInTime: true },
      })
    : [];
  const attendanceMap = new Map(attendances.map((a) => [a.studentId, a]));

  const counts = { ...EMPTY_STATUS_COUNTS };
  for (const a of attendances) counts[a.status as keyof typeof EMPTY_STATUS_COUNTS]++;

  let rows = students.map((s, idx) => {
    const att = attendanceMap.get(s.id);
    return {
      no: idx + 1,
      nis: s.nis,
      fullName: s.fullName,
      status: att?.status ?? "BELUM ABSEN",
      checkInTime: att?.checkInTime
        ? att.checkInTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
    };
  });

  if (filter.status) {
    rows = rows.filter((r) => r.status === filter.status);
  }

  const totalStudents = students.length;
  const hadirLike = counts.HADIR + counts.TERLAMBAT;
  const attendancePercentage = totalStudents > 0 ? Math.round((hadirLike / totalStudents) * 1000) / 10 : 0;

  return {
    classInfo: { id: kelas.id, name: kelas.name, majorName: kelas.major.name },
    date: date.toISOString().slice(0, 10),
    totalStudents,
    counts,
    attendancePercentage,
    students: rows,
  };
}

// ------------------------------------------------------------
// GURU
// ------------------------------------------------------------

export async function getGuruDashboard(teacherId: string, userId: string) {
  const today = serverDateOnly(new Date());
  const tomorrow = addDays(today, 1);

  const [teacher, todayScanCount, totalViolationsReported, recentViolations] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { fullName: true } }),
    prisma.attendanceLog.count({
      where: { performedBy: userId, action: "SCAN", createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.violation.count({ where: { teacherId } }),
    prisma.violation.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        date: true,
        points: true,
        status: true,
        student: { select: { fullName: true, class: { select: { name: true } } } },
        category: { select: { name: true } },
      },
    }),
  ]);

  return {
    teacherName: teacher?.fullName ?? "-",
    todayScanCount,
    totalViolationsReported,
    recentViolations: recentViolations.map((v) => ({
      id: v.id,
      studentName: v.student.fullName,
      className: v.student.class.name,
      categoryName: v.category.name,
      points: v.points,
      status: v.status,
      date: v.date.toLocaleDateString("id-ID"),
    })),
  };
}

// ------------------------------------------------------------
// SISWA
// ------------------------------------------------------------

export async function getSiswaDashboard(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: { select: { name: true } }, major: { select: { name: true } } },
  });
  if (!student) throw new AppError("Data siswa tidak ditemukan", 404);

  const today = serverDateOnly(new Date());
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const [todayAttendance, history, qrImage] = await Promise.all([
    activeSemester
      ? prisma.attendance.findUnique({
          where: { studentId_date_semesterId: { studentId, date: today, semesterId: activeSemester.id } },
        })
      : null,
    prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 30,
      select: { date: true, status: true, checkInTime: true },
    }),
    generateQrImage(student.qrToken),
  ]);

  return {
    profile: {
      fullName: student.fullName,
      nis: student.nis,
      nisn: student.nisn,
      className: student.class.name,
      majorName: student.major.name,
    },
    qrImage,
    todayStatus: todayAttendance?.status ?? "BELUM ABSEN",
    history: history.map((h) => ({
      date: h.date.toLocaleDateString("id-ID"),
      status: h.status,
      checkInTime: h.checkInTime
        ? h.checkInTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
    })),
  };
}

// ------------------------------------------------------------
// ORANG TUA
// ------------------------------------------------------------

export async function getOrangTuaDashboard(parentId: string) {
  const children = await prisma.student.findMany({
    where: { parentId },
    include: { class: { select: { name: true } }, major: { select: { name: true } } },
  });

  const today = serverDateOnly(new Date());
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  return Promise.all(
    children.map(async (child) => {
      const [todayAttendance, history, violations] = await Promise.all([
        activeSemester
          ? prisma.attendance.findUnique({
              where: {
                studentId_date_semesterId: { studentId: child.id, date: today, semesterId: activeSemester.id },
              },
            })
          : null,
        prisma.attendance.findMany({
          where: { studentId: child.id },
          orderBy: { date: "desc" },
          take: 30,
          select: { date: true, status: true, checkInTime: true },
        }),
        prisma.violation.findMany({
          where: { studentId: child.id },
          orderBy: { date: "desc" },
          take: 10,
          select: { date: true, points: true, status: true, category: { select: { name: true } } },
        }),
      ]);

      return {
        studentId: child.id,
        fullName: child.fullName,
        className: child.class.name,
        majorName: child.major.name,
        todayStatus: todayAttendance?.status ?? "BELUM ABSEN",
        history: history.map((h) => ({
          date: h.date.toLocaleDateString("id-ID"),
          status: h.status,
          checkInTime: h.checkInTime
            ? h.checkInTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            : "-",
        })),
        violations: violations.map((v) => ({
          date: v.date.toLocaleDateString("id-ID"),
          categoryName: v.category.name,
          points: v.points,
          status: v.status,
        })),
      };
    })
  );
}
