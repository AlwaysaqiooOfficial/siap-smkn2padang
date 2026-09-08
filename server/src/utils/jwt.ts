import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

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
