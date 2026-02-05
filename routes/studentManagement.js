import express from "express";
const router = express.Router();

import * as controller from "../controllers/studentManagement.controller.js";

router.get("/student-management", controller.listStudents);

router.get(
  "/student-management/enrollment/:enrollmentId/view",
  controller.viewStudent
);

export default router;
