import express from "express";
import Course from "../models/Course.js";
import CourseContent from "../models/CourseContent.js";
import Lecture from "../models/Lecture.js";
import Assignment from "../models/Assignment.js";
import Test from "../models/Test.js";

const router = express.Router();

/* ================= DELETE COURSE ================= */
router.delete("/courses/delete/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    await CourseContent.deleteMany({ course: courseId });
    await Lecture.deleteMany({ course: courseId });
    await Assignment.deleteMany({ course: courseId });
    await Test.deleteMany({ course: courseId });

    await Course.findByIdAndDelete(courseId);

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);
    res.status(500).json({ success: false });
  }
});

/* ================= SAVE SYLLABUS ================= */
router.post("/syllabus/add", async (req, res) => {
  try {
    const { course, modules } = req.body;

    await CourseContent.deleteMany({ course });

    const syllabusDocs = modules.map(mod => ({
      course,
      moduleTitle: mod.moduleTitle,
      moduleOrder: mod.moduleOrder,
      items: mod.items || [],
    }));

    await CourseContent.insertMany(syllabusDocs);

    res.redirect(`/course-management?editCourse=${course}`);
  } catch (err) {
    console.error("SYLLABUS SAVE ERROR:", err);
    res.status(500).send("Failed to save syllabus");
  }
});

/* ================= COURSE PREVIEW ================= */
router.get("/courses/:courseId/preview", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    const syllabus = await CourseContent.find({ course: courseId })
      .sort({ moduleOrder: 1 });

    const lectures = await Lecture.find({ course: courseId })
      .sort({ syllabusItemId: 1, lectureOrder: 1 });

    const assignments = await Assignment.find({ course: courseId })
      .sort({ assignmentOrder: 1 });

    const tests = await Test.find({ course: courseId })
      .sort({ testOrder: 1 });

    res.render("Backend/course-preview.ejs", {
      course,
      syllabus,
      lectures,
      assignments,
      tests,
    });
  } catch (error) {
    console.error("PREVIEW LOAD ERROR:", error);
    res.status(500).send("Failed to load preview");
  }
});

export default router;
