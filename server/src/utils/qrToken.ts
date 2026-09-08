import crypto from "crypto";

/**
 * Menghasilkan token unik untuk QR Code siswa.
 * Format: SIAP-<8 char random>-<timestamp base36>
 * Tidak dapat ditebak (crypto-random), tidak berisi data sensitif.
 */
export function generateQrToken(): string {
  const random = crypto.randomBytes(6).toString("hex").toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  return `SIAP-${random}-${timePart}`;
}
