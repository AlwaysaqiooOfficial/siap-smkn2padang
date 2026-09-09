import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as classController from "../controllers/class.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), classController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), classController.detail);
router.post("/", authorize(["SUPER_ADMIN"]), classController.create);
router.put("/:id", authorize(["SUPER_ADMIN"]), classController.update);
router.delete("/:id", authorize(["SUPER_ADMIN"]), classController.remove);

export default router;
