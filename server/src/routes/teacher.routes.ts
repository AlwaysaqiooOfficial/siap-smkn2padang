import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as teacherController from "../controllers/teacher.controller";

const router = Router();

router.use(authenticate, authorize(["SUPER_ADMIN"]));

router.get("/", teacherController.list);
router.get("/:id", teacherController.detail);
router.post("/", teacherController.create);
router.put("/:id", teacherController.update);
router.delete("/:id", teacherController.remove);

export default router;
