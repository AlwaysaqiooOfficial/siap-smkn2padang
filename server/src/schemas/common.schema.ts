import { z } from "zod";

/**
 * Kebijakan password saat akun BARU dibuat (guru, orang tua, siswa): minimal 8 karakter,
 * mengandung minimal 1 huruf dan 1 angka. Dipakai konsisten di semua schema create-account.
 * TIDAK dipakai di schema login — login hanya memverifikasi terhadap hash yang sudah
 * tersimpan, apa pun kebijakan yang berlaku saat akun itu dibuat dulu.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter") // batas aman bcrypt
  .refine((val) => /[a-zA-Z]/.test(val), "Password harus mengandung minimal 1 huruf")
  .refine((val) => /[0-9]/.test(val), "Password harus mengandung minimal 1 angka");
