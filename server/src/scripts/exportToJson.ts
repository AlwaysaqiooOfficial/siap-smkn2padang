import fs from "fs";
import path from "path";
import { prisma } from "../config/db";

const DATA_DIR = path.join(__dirname, "../../../data");

async function exportToJson() {
  console.log("📦 Mengimpor seluruh data dari Prisma/MySQL ke file JSON...");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const collections = [
    { name: "users.json", query: () => prisma.user.findMany() },
    { name: "teachers.json", query: () => prisma.teacher.findMany() },
    { name: "parents.json", query: () => prisma.parent.findMany() },
    { name: "students.json", query: () => prisma.student.findMany() },
    { name: "majors.json", query: () => prisma.major.findMany() },
    { name: "classes.json", query: () => prisma.class.findMany() },
    { name: "academic_years.json", query: () => prisma.academicYear.findMany() },
    { name: "semesters.json", query: () => prisma.semester.findMany() },
    { name: "student_class_histories.json", query: () => prisma.studentClassHistory.findMany() },
    { name: "attendance.json", query: () => prisma.attendance.findMany() },
    { name: "attendance_logs.json", query: () => prisma.attendanceLog.findMany() },
    { name: "permissions.json", query: () => prisma.permission.findMany() },
    { name: "violations.json", query: () => prisma.violation.findMany() },
    { name: "violation_categories.json", query: () => prisma.violationCategory.findMany() },
    { name: "notifications.json", query: () => prisma.notification.findMany() },
    { name: "email_logs.json", query: () => prisma.emailLog.findMany() },
    { name: "activity_logs.json", query: () => prisma.activityLog.findMany() },
    { name: "school_settings.json", query: () => prisma.schoolSetting.findMany() },
  ];

  for (const item of collections) {
    try {
      const records = await item.query();
      const filePath = path.join(DATA_DIR, item.name);
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf8");
      console.log(`  ✅ ${item.name}: ${records.length} baris tersimpan`);
    } catch (error) {
      console.warn(`  ⚠️ Gagal mengekspor ${item.name}:`, (error as Error).message);
    }
  }

  console.log("✨ Ekspor selesai.");
  await prisma.$disconnect();
}

exportToJson().catch((err) => {
  console.error("❌ Gagal mengekspor data:", err);
  process.exit(1);
});
