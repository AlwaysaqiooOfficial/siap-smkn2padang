import { Router } from "express";
import authRoutes from "./auth.routes";
import majorRoutes from "./major.routes";
import classRoutes from "./class.routes";
import teacherRoutes from "./teacher.routes";
import parentRoutes from "./parent.routes";
import studentRoutes from "./student.routes";
import attendanceRoutes from "./attendance.routes";
import permissionRoutes from "./permission.routes";
import reportRoutes from "./report.routes";
import violationCategoryRoutes from "./violationCategory.routes";
import violationRoutes from "./violation.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/majors", majorRoutes);
router.use("/classes", classRoutes);
router.use("/teachers", teacherRoutes);
router.use("/parents", parentRoutes);
router.use("/students", studentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/permissions", permissionRoutes);
router.use("/reports", reportRoutes);
router.use("/violation-categories", violationCategoryRoutes);
router.use("/violations", violationRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
