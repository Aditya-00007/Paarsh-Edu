import upload from "../middlewares/upload.js";
import express from "express";
import Lecture from "../models/Lecture.js";
import Assignment from "../models/Assignment.js";
import Test from "../models/Test.js";
import { uploadLectureVideo } from "../utils/multerCloudinaryVideo.js";

const router = express.Router();

router.post(
  "/add-lecture",
  uploadLectureVideo.single("video"),
  async (req, res) => {
    try {
      const { course, syllabusItemId, lectureTitle, lectureType } = req.body;

      // ================= VALIDATIONS =================
      if (!course) {
        return res.status(400).send("Course is required");
      }

      if (!syllabusItemId) {
        return res.status(400).send("Topic (syllabus item) is required");
      }

      if (!lectureTitle || !lectureTitle.trim()) {
        return res.status(400).send("Lecture title is required");
      }

      if (!lectureType) {
        return res.status(400).send("Lecture type is required");
      }

      // ================= PREVIEW =================
      const isPreview = req.body.isPreview === "on";

      // ================= VIDEO HANDLING =================
      let videoUrl = "";

      if (lectureType === "video") {
        // Case 1: Local upload
        if (req.file) {
          videoUrl = req.file.path; // Cloudinary video URL
        }

        // Case 2: YouTube URL
        else if (req.body.youtubeUrl) {
          const youtubeRegex =
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

          const match = req.body.youtubeUrl.match(youtubeRegex);

          if (!match) {
            return res.status(400).send("Invalid YouTube URL");
          }

          videoUrl = `https://www.youtube.com/embed/${match[1]}`;
        }
        // Neither provided
        else {
          return res
            .status(400)
            .send("Upload a video file or provide a YouTube URL");
        }
      }

      // ================= LIVE CLASS HANDLING =================
      let liveClassData = undefined;

      if (lectureType === "live") {
        const { meetingLink, scheduledAt, duration } = req.body.liveClass || {};

        if (!meetingLink || !scheduledAt) {
          return res
            .status(400)
            .send("Meeting link and schedule are required for live class");
        }

        liveClassData = {
          meetingLink,
          scheduledAt,
          duration,
        };
      }

      // ================= AUTO LECTURE ORDER =================
      const lastLecture = await Lecture.findOne({
        course,
        syllabusItemId,
      }).sort({ lectureOrder: -1 });

      const nextLectureOrder = lastLecture ? lastLecture.lectureOrder + 1 : 1;

      // ================= SAVE =================
      await Lecture.create({
        course,
        syllabusItemId,
        lectureTitle,
        lectureType,
        videoUrl,
        liveClass: liveClassData,
        lectureOrder: nextLectureOrder,
        isPreview,
        isPublished: false,
      });

      // ================= REDIRECT =================
      res.redirect(`/admin/courses/${course}/preview`);
    } catch (error) {
      console.error("LECTURE SAVE ERROR:", error);
      res.status(500).send("Internal Server Error");
    }
  },
);
// add assignment
router.post("/add-assignment", async (req, res) => {
  try {
    const {
      course,
      syllabusItemId,
      title,
      description,
      instructions,
      maxMarks,
    } = req.body;

    // ================= VALIDATION =================
    if (!course) {
      return res.status(400).send("Course is required");
    }

    if (!syllabusItemId) {
      return res.status(400).send("Assignment syllabus item is required");
    }

    if (!title || !title.trim()) {
      return res.status(400).send("Assignment title is required");
    }

    if (!description || !description.trim()) {
      return res.status(400).send("Assignment description is required");
    }

    // ================= AUTO ORDER =================
    const lastAssignment = await Assignment.findOne({
      course,
      syllabusItemId,
    }).sort({ assignmentOrder: -1 });

    const nextOrder = lastAssignment ? lastAssignment.assignmentOrder + 1 : 1;

    // ================= SAVE =================
    await Assignment.create({
      course,
      syllabusItemId,
      title,
      description,
      instructions,
      maxMarks,
      assignmentOrder: nextOrder,
      isPublished: false,
    });

    res.redirect(`/admin/courses/${course}/preview`);
  } catch (error) {
    console.error("ADD ASSIGNMENT ERROR:", error);
    res.status(500).send("Failed to add assignment");
  }
});

// test
router.post("/add-test", async (req, res) => {
  try {
    const { course, syllabusItemId, title, durationMinutes, questions } =
      req.body;

    // ================= VALIDATION =================
    if (!course) {
      return res.status(400).send("Course is required");
    }

    if (!syllabusItemId) {
      return res.status(400).send("Test syllabus item is required");
    }

    if (!title || !title.trim()) {
      return res.status(400).send("Test title is required");
    }

    if (!questions || questions.length === 0) {
      return res.status(400).send("At least one question is required");
    }

    // ================= SANITIZE QUESTIONS =================
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctOptionIndex: Number(q.correctOptionIndex),
      marks: Number(q.marks || 1),
    }));

    // ================= AUTO ORDER =================
    const lastTest = await Test.findOne({
      course,
      syllabusItemId,
    }).sort({ testOrder: -1 });

    const nextOrder = lastTest ? lastTest.testOrder + 1 : 1;

    // ================= SAVE =================
    await Test.create({
      course,
      syllabusItemId,
      title,
      durationMinutes,
      questions: formattedQuestions,
      testOrder: nextOrder,
      isPublished: false,
    });

    res.redirect(`/admin/courses/${course}/preview`);
  } catch (error) {
    console.error("ADD TEST ERROR:", error);
    res.status(500).send("Failed to add test");
  }
});

export default router;
