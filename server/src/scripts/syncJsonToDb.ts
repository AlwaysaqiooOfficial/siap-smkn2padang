import { PrismaClient } from "@prisma/client";
import { githubJsonStore } from "../services/githubJsonStore";

const prisma = new PrismaClient();

async function readJsonFile<T>(fileName: string): Promise<T[]> {
  return githubJsonStore.read<T[]>(fileName, []);
}

async function readStudents(classes: any[]) {
  const files = await Promise.all(
    classes.map((schoolClass) => githubJsonStore.read<any[]>(`students/${schoolClass.id}.json`, [])),
  );
  return files.flat();
}

function toStudentData(item: any) {
  return {
    id: item.id,
    userId: item.userId ?? null,
    nis: item.nis,
    nisn: item.nisn,
    fullName: item.fullName,
    gender: item.gender,
    birthDate: new Date(item.birthDate),
    address: item.address ?? null,
    majorId: item.majorId,
    classId: item.classId,
    parentId: null,
    qrToken: item.qrToken,
    isActive: item.isActive,
    emailSent: item.emailSent ?? false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function syncJsonToDatabase() {
  console.log("🔄 Sinkronisasi file JSON dari folder `data/` ke database MySQL lokal...");

  // 1. MAJORS
  const majors = await readJsonFile<any>("majors.json");
  for (const item of majors) {
    await prisma.major.upsert({
      where: { id: item.id },
      update: { code: item.code, name: item.name },
      create: item,
    });
  }
  console.log(`  ✅ Majors: ${majors.length} tersimpan`);

  // 2. ACADEMIC YEARS
  const academicYears = await readJsonFile<any>("academic_years.json");
  for (const item of academicYears) {
    await prisma.academicYear.upsert({
      where: { id: item.id },
      update: { name: item.name, isActive: item.isActive },
      create: item,
    });
  }
  console.log(`  ✅ Academic Years: ${academicYears.length} tersimpan`);

  // 3. SEMESTERS
  const semesters = await readJsonFile<any>("semesters.json");
  for (const item of semesters) {
    await prisma.semester.upsert({
      where: { id: item.id },
      update: {
        academicYearId: item.academicYearId,
        name: item.name,
        order: item.order,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        isActive: item.isActive,
      },
      create: {
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
      },
    });
  }
  console.log(`  ✅ Semesters: ${semesters.length} tersimpan`);

  // 4. USERS
  const users = await readJsonFile<any>("users.json");
  for (const item of users) {
    await prisma.user.upsert({
      where: { id: item.id },
      update: {
        email: item.email,
        username: item.username,
        passwordHash: item.passwordHash,
        role: item.role,
        isActive: item.isActive,
      },
      create: item,
    });
  }
  console.log(`  ✅ Users: ${users.length} tersimpan`);

  // 5. TEACHERS
  const teachers = (await readJsonFile<any>("teachers.json")).filter((item) => item.userId);
  for (const item of teachers) {
    await prisma.teacher.upsert({
      where: { id: item.id },
      update: {
        userId: item.userId,
        nip: item.nip,
        fullName: item.fullName,
        phone: item.phone,
        isHomeroom: item.isHomeroom,
      },
      create: item,
    });
  }
  console.log(`  ✅ Teachers: ${teachers.length} tersimpan`);

  // 6. CLASSES
  const classes = await readJsonFile<any>("classes.json");
  for (const item of classes) {
    await prisma.class.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        grade: item.grade,
        majorId: item.majorId,
        homeroomTeacherId: item.homeroomTeacherId,
      },
      create: item,
    });
  }
  console.log(`  ✅ Classes: ${classes.length} tersimpan`);

  // 7. PARENTS
  const parents: any[] = [];
  for (const item of parents) {
    await prisma.parent.upsert({
      where: { id: item.id },
      update: {
        userId: item.userId,
        fullName: item.fullName,
        phone: item.phone,
        address: item.address,
      },
      create: item,
    });
  }
  console.log(`  ✅ Parents: ${parents.length} tersimpan`);

  // 8. STUDENTS
  const students = await readStudents(classes);
  for (const item of students) {
    const studentData = toStudentData(item);
    const { id: _studentId, ...studentUpdateData } = studentData;
    await prisma.student.upsert({
      where: { id: item.id },
      update: studentUpdateData,
      create: studentData,
    });
  }
  console.log(`  ✅ Students: ${students.length} tersimpan`);

  // 9. SCHOOL SETTINGS
  const schoolSettings = await readJsonFile<any>("school_settings.json");
  for (const item of schoolSettings) {
    await prisma.schoolSetting.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    });
  }
  console.log(`  ✅ School Settings: ${schoolSettings.length} tersimpan`);

  // 10. VIOLATION CATEGORIES
  const violationCategories = await readJsonFile<any>("violation_categories.json");
  for (const item of violationCategories) {
    await prisma.violationCategory.upsert({
      where: { id: item.id },
      update: { name: item.name, points: item.points },
      create: item,
    });
  }
  console.log(`  ✅ Violation Categories: ${violationCategories.length} tersimpan`);

  console.log("✨ Data database MySQL lokal dan folder `data/` sudah 100% SAMA dan PAS!");
  await prisma.$disconnect();
}

syncJsonToDatabase().catch(async (err) => {
  console.error("❌ Gagal sinkronisasi data:", err);
  await prisma.$disconnect();
  process.exit(1);
});
