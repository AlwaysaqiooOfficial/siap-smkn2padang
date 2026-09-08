import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as categoryController from "../controllers/violationCategory.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), categoryController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), categoryController.detail);
router.post("/", authorize(["SUPER_ADMIN"]), categoryController.create);
router.put("/:id", authorize(["SUPER_ADMIN"]), categoryController.update);
router.delete("/:id", authorize(["SUPER_ADMIN"]), categoryController.remove);

export default router;
