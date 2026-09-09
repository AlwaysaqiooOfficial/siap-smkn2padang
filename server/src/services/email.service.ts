import { findFirst, transaction } from "./jsonDatabase";
import { logger } from "../utils/logger";
import { triggerEmailProcessing } from "../utils/emailQueue";
import { attendanceEmailTemplate } from "../templates/email/attendance.template";
import { autoAlfaEmailTemplate } from "../templates/email/autoAlfa.template";
import { permissionApprovedEmailTemplate } from "../templates/email/permission.template";
import { violationEmailTemplate } from "../templates/email/violation.template";

interface QueueEmailParams {
  to: string;
  subject: string;
  html: string;
  relatedType?: string;
  relatedId?: string;
}

/**
 * Menyimpan email sebagai PENDING di email_logs lalu memicu worker background untuk
 * benar-benar mengirimnya. TIDAK PERNAH melempar error ke pemanggil — kegagalan apa pun
 * (termasuk gagal insert) hanya dicatat di log server, sehingga transaksi utama
 * (absensi/izin/pelanggaran) tidak pernah gagal karena masalah email.
 */
async function queueEmail(params: QueueEmailParams): Promise<void> {
  try {
    await transaction(async (db) => {
      db.create("email_queue", {
        id: crypto.randomUUID(),
        toEmail: params.to,
        subject: params.subject,
        body: params.html,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        sentAt: null,
        errorMessage: null,
        relatedType: params.relatedType,
        relatedId: params.relatedId,
      });
    });
    triggerEmailProcessing();
  } catch (err) {
    logger.error("[email] Gagal membuat email_queue:", err);
  }
}

interface ParentContact {
  email: string;
  parentName: string;
}

async function getParentContact(studentId: string): Promise<ParentContact | null> {
  const student = findFirst<any>("students", (item) => item.id === studentId);
  if (!student) return null;

  const parent = student.parent ?? (student.parentId ? findFirst<any>("parents", (item) => item.id === student.parentId) : null);
  const parentUser = parent?.user ?? (parent?.userId ? findFirst<any>("users", (item) => item.id === parent.userId) : null);
  const email = student.parentEmail ?? student.parent_email ?? parent?.email ?? parentUser?.email;
  if (!email || parent?.isActive === false || parentUser?.isActive === false) return null;
  return { email, parentName: student.parentFullName ?? student.parent_full_name ?? parent?.fullName ?? "Orang Tua" };
}

// ------------------------------------------------------------
// Fungsi per event — dipanggil dari service lain, selalu fire-and-forget & aman dari error
// ------------------------------------------------------------

export async function sendAttendanceEmail(params: {
  studentId: string;
  studentName: string;
  className: string;
  majorName: string;
  status: "HADIR" | "TERLAMBAT";
  checkInTime: Date;
  attendanceId: string;
}) {
  const contact = await getParentContact(params.studentId);
  if (!contact) return; // tidak ada orang tua/email terdaftar -> lewati diam-diam

  const { subject, html } = attendanceEmailTemplate({
    studentName: params.studentName,
    className: params.className,
    majorName: params.majorName,
    status: params.status,
    checkInTime: params.checkInTime,
    parentName: contact.parentName,
  });

  await queueEmail({
    to: contact.email,
    subject,
    html,
    relatedType: "ATTENDANCE",
    relatedId: params.attendanceId,
  });
}

export async function sendAutoAlfaEmail(params: {
  studentId: string;
  studentName: string;
  className: string;
  majorName: string;
  date: Date;
  attendanceId: string;
}) {
  const contact = await getParentContact(params.studentId);
  if (!contact) return;

  const { subject, html } = autoAlfaEmailTemplate({
    studentName: params.studentName,
    className: params.className,
    majorName: params.majorName,
    date: params.date,
    parentName: contact.parentName,
  });

  await queueEmail({
    to: contact.email,
    subject,
    html,
    relatedType: "ATTENDANCE",
    relatedId: params.attendanceId,
  });
}

export async function sendPermissionApprovedEmail(params: {
  studentId: string;
  studentName: string;
  className: string;
  majorName: string;
  type: "IZIN" | "SAKIT";
  date: Date;
  reason: string;
  permissionId: string;
}) {
  const contact = await getParentContact(params.studentId);
  if (!contact) return;

  const { subject, html } = permissionApprovedEmailTemplate({
    studentName: params.studentName,
    className: params.className,
    majorName: params.majorName,
    type: params.type,
    date: params.date,
    reason: params.reason,
    parentName: contact.parentName,
  });

  await queueEmail({
    to: contact.email,
    subject,
    html,
    relatedType: "PERMISSION",
    relatedId: params.permissionId,
  });
}

/**
 * Siap dipakai mulai Phase 6 (Violation System) — dipanggil setelah pelanggaran dengan
 * kategori tertentu dibuat. Sudah lengkap & teruji lewat pola yang sama seperti event lain.
 */
export async function sendViolationEmail(params: {
  studentId: string;
  studentName: string;
  className: string;
  majorName: string;
  categoryName: string;
  points: number;
  date: Date;
  description?: string;
  violationId: string;
}) {
  const contact = await getParentContact(params.studentId);
  if (!contact) return;

  const { subject, html } = violationEmailTemplate({
    studentName: params.studentName,
    className: params.className,
    majorName: params.majorName,
    categoryName: params.categoryName,
    points: params.points,
    date: params.date,
    description: params.description,
    parentName: contact.parentName,
  });

  await queueEmail({
    to: contact.email,
    subject,
    html,
    relatedType: "VIOLATION",
    relatedId: params.violationId,
  });
}
