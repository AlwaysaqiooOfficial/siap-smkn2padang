import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/admin", authorize(["SUPER_ADMIN"]), dashboardController.admin);
router.get("/wali-kelas", authorize(["WALI_KELAS"]), dashboardController.waliKelas);
router.get("/guru", authorize(["GURU"]), dashboardController.guru);
router.get("/scanner", authorize(["SCANNER"]), dashboardController.scanner);
router.get("/siswa", authorize(["SISWA"]), dashboardController.siswa);
router.get("/orang-tua", authorize(["ORANG_TUA"]), dashboardController.orangTua);

export default router;
