import express from "express";
const router = express.Router();

import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";

//  STUDENT DETAILS PAGE 
router.get("/student-management/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Student basic info
    const student = await Student.findById(id);
    if (!student) {
      return res.redirect("/student-management");
    }

    //  Enrollment & Course
    const enrollment = await Enrollment.findOne({ student: id });
    const course = enrollment
      ? await Course.findById(enrollment.course)
      : null;

    //  Assignments
    const assignments = await AssignmentSubmission.find({
      student: id
    }).sort({ submittedAt: -1 });

    //  Tests (dummy for now)
    const tests = [];

    res.render("admin/student-details", {
      student,
      enrollment,
      course,
      assignments,
      tests
    });

  } catch (err) {
    console.error("Admin student details error:", err);
    res.redirect("/student-management");
  }
});

export default router;
