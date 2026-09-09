import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";
import { logger } from "../utils/logger";

let transporter: Transporter | null = null;

/** true jika SMTP_HOST/SMTP_USER/SMTP_PASS sudah diisi di .env. */
export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/** Transporter dibuat sekali (singleton) dan hanya jika kredensial SMTP tersedia di .env. */
export function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;

  const password = env.SMTP_PASS?.replace(/\s+/g, "");

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: env.SMTP_USER, pass: password },
    });
  }
  return transporter;
}

export function getFromAddress(): string {
  return `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`;
}

/** Dipanggil sekali saat startup untuk memberi tahu status konfigurasi SMTP di log. */
export function logMailerStatus() {
  if (isSmtpConfigured()) {
    logger.info(`📧 SMTP terkonfigurasi (${env.SMTP_HOST}) — email akan benar-benar dikirim`);
  } else {
    logger.warn(
      "📧 SMTP belum dikonfigurasi (SMTP_HOST/SMTP_USER/SMTP_PASS kosong) — email akan tercatat FAILED di email_logs"
    );
  }
}
