import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Anti brute-force: percobaan login jauh lebih dibatasi daripada rate limit umum di app.ts.
// Dihitung per kombinasi IP, bukan per akun — supaya tidak bisa dipakai untuk mengunci akun
// orang lain (account lockout via forged requests), sambil tetap membatasi penyerang dari 1 IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.",
  },
});

router.post("/login", loginLimiter, login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

export default router;
