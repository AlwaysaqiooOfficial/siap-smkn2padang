import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const output = path.join(__dirname, "../supabase-seed.sql");

type RecordValue = Record<string, any>;

function readJson<T>(relativePath: string, fallback: T): T {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function sql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

function dateOnly(value: unknown): string | null {
  if (!value) return null;
  const text = String(value);
  return text.slice(0, 10);
}

function timestamp(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function insert(table: string, columns: string[], rows: unknown[][], conflictClause = "on conflict (id) do nothing"): string {
  if (!rows.length) return `-- ${table}: no source records\n`;
  const values = rows.map((row) => `(${row.map(sql).join(", ")})`).join(",\n");
  const safeColumns = columns.map((column) => column === "order" ? '"order"' : column);
  return `insert into public.${table} (${safeColumns.join(", ")}) values\n${values}\n${conflictClause};\n`;
}

function insertStudentsByClass(records: RecordValue[]): string {
  const columns = ["id", "user_id", "nis", "nisn", "full_name", "gender", "birth_date", "address", "major_id", "class_id", "parent_id", "parent_full_name", "parent_email", "parent_phone", "parent_address", "qr_token", "is_active", "email_sent", "created_at", "updated_at"];
  const grouped = new Map<string, RecordValue[]>();
  for (const record of records) {
    const classId = String(record.classId ?? record.class_id ?? "tanpa-kelas");
    const group = grouped.get(classId) ?? [];
    group.push(record);
    grouped.set(classId, group);
  }

  return [...grouped.entries()].map(([classId, classStudents]) => {
    const schoolClass = classes.find((item) => String(item.id) === classId);
    const label = schoolClass ? `${schoolClass.name} (${classId})` : classId;
    return `-- students/${classId}.json - ${label}\n${insert("students", columns, classStudents.map((item) => [item.id, item.userId ?? item.user_id, item.nis, item.nisn, item.fullName ?? item.full_name, item.gender, timestamp(item.birthDate ?? item.birth_date), item.address, item.majorId ?? item.major_id, item.classId ?? item.class_id, item.parentId ?? item.parent_id, item.parent?.fullName ?? item.parent?.full_name ?? item.parentFullName ?? item.parent_full_name, item.parent?.email ?? item.parentEmail ?? item.parent_email, item.parent?.phone ?? item.parentPhone ?? item.parent_phone, item.parent?.address ?? item.parentAddress ?? item.parent_address, item.qrToken ?? item.qr_token, item.isActive ?? item.is_active ?? true, item.emailSent ?? item.email_sent ?? false, timestamp(item.createdAt), timestamp(item.updatedAt)]))}`;
  }).join("\n");
}

const users = readJson<RecordValue[]>("users.json", []);
const teachers = readJson<RecordValue[]>("teachers.json", []);
const majors = readJson<RecordValue[]>("majors.json", []);
const classes = readJson<RecordValue[]>("classes.json", []);
const academicYears = readJson<RecordValue[]>("academic_years.json", []);
const semesters = readJson<RecordValue[]>("semesters.json", []);
const settings = readJson<RecordValue[]>("school_settings.json", []);
const categories = readJson<RecordValue[]>("violation_categories.json", []);
const attendance = readJson<RecordValue[]>("attendance.json", []);
const permissions = readJson<RecordValue[]>("permissions.json", []);
const violations = readJson<RecordValue[]>("violations.json", []);
const notifications = readJson<RecordValue[]>("notifications.json", []);
const emailQueue = readJson<RecordValue[]>("email_queue.json", []);

const students = fs.existsSync(path.join(root, "students"))
  ? fs.readdirSync(path.join(root, "students"), "utf8")
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => readJson<RecordValue[]>(path.join("students", file), []))
  : [];

const parentMap = new Map<string, RecordValue>();
for (const student of students) {
  if (student.parent?.id) parentMap.set(String(student.parent.id), student.parent);
}

const teacherById = new Map(teachers.map((teacher) => [String(teacher.id), teacher]));
const studentIds = new Set(students.map((student) => String(student.id)));
const fallbackYearId = "academic-year-2026-2027";
const fallbackSemesterId = "semester-2026-2027-ganjil";
const fallbackYear = {
  id: fallbackYearId,
  name: "2026/2027",
  isActive: true,
  createdAt: new Date().toISOString(),
};
const fallbackSemester = {
  id: fallbackSemesterId,
  academicYearId: fallbackYearId,
  name: "Ganjil",
  order: 1,
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2026-12-31T23:59:59.000Z",
  isActive: true,
  createdAt: new Date().toISOString(),
};
const sourceSemesterIds = new Set(semesters.map((item) => String(item.id)));

const chunks = [
  "-- Generated from the repository JSON files. Run supabase-schema.sql first.\n",
  "begin;\n",
  insert("users", ["id", "email", "username", "password_hash", "role", "is_active", "last_login_at", "created_at", "updated_at"], users.map((item) => [item.id, item.email, item.username, item.passwordHash ?? item.password_hash ?? item.password, item.role, item.isActive ?? true, timestamp(item.lastLoginAt), timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("majors", ["id", "code", "name", "created_at", "updated_at"], majors.map((item) => [item.id, item.code, item.name, timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("teachers", ["id", "user_id", "nip", "full_name", "phone", "is_homeroom", "created_at", "updated_at"], teachers.map((item) => [item.id, item.userId ?? item.user_id, item.nip, item.fullName ?? item.full_name ?? item.name, item.phone, item.isHomeroom ?? item.is_homeroom ?? false, timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("parents", ["id", "user_id", "full_name", "email", "phone", "address", "created_at", "updated_at"], [...parentMap.values()].map((item) => [item.id, item.userId ?? item.user_id, item.fullName ?? item.full_name ?? item.name, item.email, item.phone, item.address, timestamp(item.createdAt), timestamp(item.updatedAt)]), "on conflict (id) do update set user_id = excluded.user_id, full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, address = excluded.address, updated_at = excluded.updated_at"),
  insert("classes", ["id", "name", "grade", "major_id", "homeroom_teacher_id", "created_at", "updated_at"], classes.map((item) => [item.id, item.name, item.grade, item.majorId ?? item.major_id, item.homeroomTeacherId ?? item.homeroom_teacher_id, timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("academic_years", ["id", "name", "is_active", "created_at"], (academicYears.length ? academicYears : [fallbackYear]).map((item) => [item.id, item.name, item.isActive ?? item.is_active ?? false, timestamp(item.createdAt)])),
  insert("semesters", ["id", "academic_year_id", "name", "order", "start_date", "end_date", "is_active", "created_at"], (semesters.length ? semesters : [fallbackSemester]).map((item) => [item.id, item.academicYearId ?? item.academic_year_id, item.name, item.order, timestamp(item.startDate ?? item.start_date), timestamp(item.endDate ?? item.end_date), item.isActive ?? item.is_active ?? false, timestamp(item.createdAt)])),
  insertStudentsByClass(students),
  insert("school_settings", ["id", "key", "value", "updated_at"], settings.map((item) => [item.id ?? item.key, item.key, item.value, timestamp(item.updatedAt)])),
  insert("violation_categories", ["id", "name", "points", "created_at"], categories.map((item) => [item.id, item.name, item.points ?? 0, timestamp(item.createdAt)])),
  insert("attendance", ["id", "student_id", "semester_id", "date", "check_in_time", "status", "permission_id", "created_at", "updated_at"], attendance.filter((item) => studentIds.has(String(item.studentId ?? item.student_id))).map((item) => [item.id, item.studentId ?? item.student_id, sourceSemesterIds.has(String(item.semesterId ?? item.semester_id)) ? item.semesterId ?? item.semester_id : fallbackSemesterId, dateOnly(item.date), timestamp(item.checkInTime ?? item.check_in_time), item.status, item.permissionId ?? item.permission_id, timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("permissions", ["id", "student_id", "type", "reason", "date", "attachment", "status", "reviewed_by", "reviewed_at", "created_at", "updated_at"], permissions.filter((item) => studentIds.has(String(item.studentId ?? item.student_id))).map((item) => [item.id, item.studentId ?? item.student_id, item.type, item.reason ?? "", dateOnly(item.date), item.attachment, item.status ?? "PENDING", item.reviewedBy ?? item.reviewed_by ?? item.approvedBy ?? item.approved_by, timestamp(item.reviewedAt ?? item.reviewed_at ?? item.approvedAt ?? item.approved_at), timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("violations", ["id", "student_id", "teacher_id", "category_id", "description", "date", "points", "status", "created_at", "updated_at"], violations.filter((item) => studentIds.has(String(item.studentId ?? item.student_id))).map((item) => [item.id, item.studentId ?? item.student_id, item.teacherId ?? item.teacher_id ?? [...teacherById.keys()][0], item.categoryId ?? item.category_id ?? item.violationCategoryId ?? item.violation_category_id, item.description, dateOnly(item.date), item.points ?? item.point ?? 0, item.status ?? "REPORTED", timestamp(item.createdAt), timestamp(item.updatedAt)])),
  insert("notifications", ["id", "user_id", "title", "message", "is_read", "created_at"], notifications.map((item) => [item.id, item.userId ?? item.user_id, item.title, item.message, item.isRead ?? item.is_read ?? false, timestamp(item.createdAt)])),
  insert("email_logs", ["id", "to_email", "subject", "body", "status", "error_message", "related_type", "related_id", "sent_at", "created_at"], emailQueue.map((item) => [item.id, item.toEmail ?? item.to_email ?? item.email, item.subject ?? "", item.body ?? "", item.status ?? "PENDING", item.errorMessage ?? item.error_message, item.relatedType ?? item.related_type, item.relatedId ?? item.related_id, timestamp(item.sentAt ?? item.sent_at), timestamp(item.createdAt)])),
  "commit;\n",
];

fs.writeFileSync(output, chunks.join("\n"), "utf8");
console.log(`Generated ${path.relative(root, output)} from ${students.length} students and ${users.length} users.`);
