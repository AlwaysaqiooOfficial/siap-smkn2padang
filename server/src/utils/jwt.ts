import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
export type Role = "SUPER_ADMIN" | "SCANNER" | "WALI_KELAS" | "GURU" | "ORANG_TUA" | "SISWA";

export interface JwtPayload {
  userId: string;
  role: Role;
  teacherId?: string;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
