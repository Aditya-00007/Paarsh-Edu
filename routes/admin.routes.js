import express from "express";
import Course from "../models/Course.js";
import CourseContent from "../models/CourseContent.js";

const router = express.Router();

router.get("/courses/:courseId/lectures", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    const lectures = await CourseContent.find({
      course: req.params.courseId,
    }).sort({ sectionOrder: 1, lectureOrder: 1 });

    res.render("Backend/course-lectures.ejs", {
      course,
      lectures,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading lectures page");
  }
});

export default router;

router.delete("/courses/delete/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Delete all lectures of the course
    await CourseContent.deleteMany({ course: courseId });

    // Delete the course itself
    await Course.findByIdAndDelete(courseId);

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);
    res.status(500).json({ success: false });
  }
});
