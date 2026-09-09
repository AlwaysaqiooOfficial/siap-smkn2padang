import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as parentController from "../controllers/parent.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["SUPER_ADMIN", "WALI_KELAS"]), parentController.list);
router.get("/:id", authorize(["SUPER_ADMIN", "WALI_KELAS"]), parentController.detail);
router.post("/", authorize(["SUPER_ADMIN"]), parentController.create);
router.put("/:id", authorize(["SUPER_ADMIN"]), parentController.update);
router.delete("/:id", authorize(["SUPER_ADMIN"]), parentController.remove);

export default router;
