import Enrollment from "../models/Enrollment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import TestAttempt from "../models/TestAttempt.js";
import Lecture from "../models/lecture.js";

export const listStudents = async (req, res) => {
  const enrollments = await Enrollment.find()
    .populate("student")
    .populate("course")
    .lean();

  // ✅ REMOVE broken rows
  const validEnrollments = enrollments.filter(
    e => e.student && e.course
  );

  res.render("Backend/studentmanagement", {
    enrollments: validEnrollments
  });
};

export const viewStudent = async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("student")
    .populate("course")
    .lean();

  if (!enrollment) {
    return res.redirect("/student-management");
  }

  const assignments = await AssignmentSubmission.find({
    student: enrollment.student._id,
    course: enrollment.course._id,
  });

  const tests = await TestAttempt.find({
    student: enrollment.student._id,
    course: enrollment.course._id,
  });

  const lectures = await Lecture.find({
    course: enrollment.course._id,
  });

  res.render("Backend/student-view", {
    student: enrollment.student,
    enrollment,
    course: enrollment.course,
    assignments,
    tests,
    lectures,
    sessionStats: {
      totalSessions: lectures.filter(l => l.lectureType === "live").length,
      attended: 0,
      missed: 0,
      doubtsRaised: 0,
      attendancePercent: 0,
    },
  });
};
