import express from "express";
const router = express.Router();

import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import TestAttempt from "../models/TestAttempt.js";
import Course from "../models/Course.js";

/*  STUDENT LIST  */
router.get("/", async (req, res) => {
  try {
    let enrollments = await Enrollment.find()
      .populate("student", "name email phone gender city educationLevel")
      .populate("course", "title level fee duration")
      .lean();

    //  SAFETY FILTER
    enrollments = enrollments.filter(e => e.student && e.course);

    res.render("Backend/studentmanagement", { enrollments });
  } catch (err) {
    console.error("Student List Error:", err);
    res.status(500).send("Server Error");
  }
});

/*  VIEW STUDENT  */
router.get("/enrollment/:enrollmentId/view", async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("student", "name email phone gender city educationLevel")
      .populate("course", "title duration level fee")
      .lean();

    if (!enrollment) {
      return res.status(404).send("Enrollment not found");
    }

    if (!enrollment.student || !enrollment.course) {
      return res.status(404).send("Student or Course missing for this enrollment");
    }

    const student = enrollment.student;
    const course = enrollment.course;

    const assignments = await AssignmentSubmission.find({
      student: student._id,
      course: course._id
    })
      .sort({ submittedAt: -1 })
      .lean();

    const tests = await TestAttempt.find({
      student: student._id,
      course: course._id
    })
      .sort({ submittedAt: -1 })
      .lean();

    res.render("Backend/student-view", {
      student,
      enrollment,
      course,
      assignments,
      tests
    });

  } catch (err) {
    console.error("Enrollment View Error:", err);
    res.status(500).send("Server Error");
  }
});

/*  EDIT STUDENT  */

router.get("/student/:id/edit", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.render("Backend/student-edit", { student });
  } catch (err) {
    console.error("Edit Student Error:", err);
    res.status(500).send("Server Error");
  }
});

export default router;
