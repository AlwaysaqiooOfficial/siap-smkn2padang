import type { NextFunction, Request, Response } from "express";
import {
  createPermissionSchema,
  listPermissionSchema,
  reviewPermissionSchema,
} from "../schemas/permission.schema";
import * as permissionService from "../services/permission.service";
import { getHomeroomClassId } from "../services/homeroom.helper";
import { created, fail, ok } from "../utils/apiResponse";

async function resolveScopedClassId(req: Request): Promise<string | undefined> {
  if (req.user!.role === "WALI_KELAS") {
    return getHomeroomClassId(req.user!.userId);
  }
  return undefined;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listPermissionSchema.parse(req.query);
    const scopedClassId = await resolveScopedClassId(req);
    const { data, meta } = await permissionService.listPermissions(input, scopedClassId);
    return res.json({ success: true, message: "Daftar pengajuan berhasil diambil", data, meta });
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await permissionService.getPermissionById(req.params.id);
    const scopedClassId = await resolveScopedClassId(req);
    if (scopedClassId && data.student.classId !== scopedClassId) {
      return fail(res, "Anda tidak memiliki akses ke pengajuan ini", 403);
    }
    return ok(res, data, "Detail pengajuan berhasil diambil");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createPermissionSchema.parse(req.body);
    const scopedClassId = await resolveScopedClassId(req);
    const data = await permissionService.createPermission(input, scopedClassId);
    return created(res, data, "Pengajuan berhasil dibuat, menunggu persetujuan wali kelas");
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const input = reviewPermissionSchema.parse(req.body ?? {});
    const scopedClassId = await resolveScopedClassId(req);
    const data = await permissionService.approvePermission(
      req.params.id,
      req.user!.userId,
      input,
      scopedClassId
    );
    return ok(res, data, "Pengajuan disetujui");
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const input = reviewPermissionSchema.parse(req.body ?? {});
    const scopedClassId = await resolveScopedClassId(req);
    const data = await permissionService.rejectPermission(
      req.params.id,
      req.user!.userId,
      input,
      scopedClassId
    );
    return ok(res, data, "Pengajuan ditolak");
  } catch (err) {
    next(err);
  }
}
