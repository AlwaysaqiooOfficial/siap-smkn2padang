import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as reportController from "../controllers/report.controller";

const router = Router();

router.use(authenticate, authorize(["SUPER_ADMIN", "GURU", "WALI_KELAS"]));

router.get("/overview", reportController.overview);

router.get("/daily", reportController.daily);
router.get("/weekly", reportController.weekly);
router.get("/monthly", reportController.monthly);
router.get("/semester", reportController.semester);
router.get("/custom", reportController.custom);

export default router;
