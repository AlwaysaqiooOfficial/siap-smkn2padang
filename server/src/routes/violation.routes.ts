import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as violationController from "../controllers/violation.controller";

const router = Router();

router.use(authenticate);

// GURU: membuat laporan + melihat histori laporannya sendiri.
// WALI_KELAS: melihat pelanggaran siswa di kelasnya + meninjau status.
// SUPER_ADMIN: akses penuh.
router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), violationController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), violationController.detail);
router.post("/", authorize(["SUPER_ADMIN", "GURU"]), violationController.create);
router.put("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), violationController.update);
router.delete("/:id", authorize(["SUPER_ADMIN"]), violationController.remove);

export default router;
