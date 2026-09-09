import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as permissionController from "../controllers/permission.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS"]), permissionController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS"]), permissionController.detail);
router.post("/", authorize(["SUPER_ADMIN", "WALI_KELAS"]), permissionController.create);
router.put("/:id/approve", authorize(["SUPER_ADMIN", "WALI_KELAS"]), permissionController.approve);
router.put("/:id/reject", authorize(["SUPER_ADMIN", "WALI_KELAS"]), permissionController.reject);

export default router;
