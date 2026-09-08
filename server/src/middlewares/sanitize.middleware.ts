import type { NextFunction, Request, Response } from "express";

// Menghapus tag <script>...</script>, tag HTML lain yang berpotensi berbahaya, dan null byte.
const SCRIPT_TAG_REGEX = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*?>/gi;
const NULL_BYTE_REGEX = /\u0000/g;

export function sanitizeString(value: string): string {
  return value
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .replace(NULL_BYTE_REGEX, "")
    .trim();
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }
  return value;
}

/**
 * Sanitasi rekursif terhadap req.body dan req.params — membersihkan tag HTML/script dan
 * null byte dari setiap string sebelum masuk ke layer validasi (Zod) & business logic.
 * Ini adalah lapisan pertahanan tambahan; Zod tetap menjadi validator utama tipe & format data,
 * dan Prisma (parameterized query) tetap menjadi pertahanan utama terhadap SQL injection.
 *
 * req.query SENGAJA tidak diubah di sini: pada beberapa versi Express, req.query adalah
 * getter read-only sehingga reassignment bisa melempar error di runtime. Query string yang
 * dipakai aplikasi ini selalu melalui skema Zod (mis. paginationSchema, reportQuerySchema)
 * yang sudah memvalidasi tipe & format-nya masing-masing.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeString(req.params[key]);
    }
  }
  next();
}
