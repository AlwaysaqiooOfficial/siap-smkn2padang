import type { NextFunction, Request, Response } from "express";
import { createStudentSchema, updateStudentSchema, createStudentAccountSchema } from "../schemas/student.schema";
import * as studentService from "../services/student.service";
import { getHomeroomClassId } from "../services/homeroom.helper";
import { created, fail, ok } from "../utils/apiResponse";
import { prisma } from "../config/db";

async function resolveScopedClassId(req: Request): Promise<string | undefined> {
  if (req.user!.role === "WALI_KELAS" || req.user!.role === "GURU") {
    return getHomeroomClassId(req.user!.userId, req.user!.teacherId);
  }
  return undefined;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    const { data, meta } = await studentService.listStudents({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      classId: scopedClassId ?? req.query.classId,
      majorId: req.query.majorId,
    } as unknown as studentService.StudentListFilter);
    return res.json({ success: true, message: "Daftar siswa berhasil diambil", data, meta });
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    const data = await studentService.getStudentById(req.params.id);
    if (scopedClassId && data.class && data.class.id !== scopedClassId) {
      return fail(res, "Anda tidak memiliki akses ke siswa ini", 403);
    }
    return ok(res, data, "Detail siswa berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createStudentSchema.parse(req.body);
    const scopedClassId = await resolveScopedClassId(req);
    const data = await studentService.createStudent(input, scopedClassId);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "Student", entityId: data.id, ipAddress: req.ip },
    });
    return created(res, data, "Siswa berhasil didaftarkan");
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateStudentSchema.parse(req.body);
    const scopedClassId = await resolveScopedClassId(req);
    const data = await studentService.updateStudent(req.params.id, input, scopedClassId);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "UPDATE", entity: "Student", entityId: data.id, ipAddress: req.ip },
    });
    return ok(res, data, "Data siswa berhasil diperbarui");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    await studentService.deleteStudent(req.params.id, scopedClassId);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "DELETE", entity: "Student", entityId: req.params.id, ipAddress: req.ip },
    });
    return ok(res, null, "Siswa berhasil dinonaktifkan");
  } catch (err) {
    next(err);
  }
}

export async function qrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    if (scopedClassId) {
      const student = await studentService.getStudentById(req.params.id);
      if (student.class && student.class.id !== scopedClassId) {
        return fail(res, "Anda tidak memiliki akses ke siswa ini", 403);
      }
    }
    const data = await studentService.getStudentQrImage(req.params.id);
    return ok(res, data, "QR Code siswa berhasil dibuat");
  } catch (err) {
    next(err);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const scopedClassId = await resolveScopedClassId(req);
    if (scopedClassId) {
      const student = await studentService.getStudentById(req.params.id);
      if (student.class && student.class.id !== scopedClassId) {
        return fail(res, "Anda tidak memiliki akses ke siswa ini", 403);
      }
    }
    const input = createStudentAccountSchema.parse(req.body);
    const data = await studentService.createStudentAccount(req.params.id, input);
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, action: "CREATE", entity: "User", entityId: data.userId, ipAddress: req.ip, metadata: { role: "SISWA", studentId: req.params.id } },
    });
    return created(res, data, "Akun login siswa berhasil dibuat");
  } catch (err) {
    next(err);
  }
}
