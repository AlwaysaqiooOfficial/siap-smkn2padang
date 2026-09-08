import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as majorController from "../controllers/major.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), majorController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS", "GURU"]), majorController.detail);
router.post("/", authorize(["SUPER_ADMIN"]), majorController.create);
router.put("/:id", authorize(["SUPER_ADMIN"]), majorController.update);
router.delete("/:id", authorize(["SUPER_ADMIN"]), majorController.remove);

export default router;
