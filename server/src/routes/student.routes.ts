import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as studentController from "../controllers/student.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), studentController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), studentController.detail);
router.get("/:id/qr", authorize(["SUPER_ADMIN", "GURU", "WALI_KELAS"]), studentController.qrCode);
router.post("/:id/account", authorize(["SUPER_ADMIN"]), studentController.createAccount);
router.post("/", authorize(["SUPER_ADMIN", "GURU"]), studentController.create);
router.put("/:id", authorize(["SUPER_ADMIN", "GURU"]), studentController.update);
router.delete("/:id", authorize(["SUPER_ADMIN", "GURU"]), studentController.remove);

export default router;
