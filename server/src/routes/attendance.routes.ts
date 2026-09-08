import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as attendanceController from "../controllers/attendance.controller";

const router = Router();

router.use(authenticate);

// Hanya akun scanner khusus dan admin yang boleh mencatat absensi.
router.post("/scan", authorize(["SCANNER", "SUPER_ADMIN"]), attendanceController.scan);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), attendanceController.list);

export default router;
