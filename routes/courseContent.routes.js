import upload from "../middlewares/upload.js";
import express from "express";
import CourseContent from "../models/CourseContent.js";

const router = express.Router();

router.post(
  "/add-lecture",
  upload.single("video"),
  async (req, res) => {
    try {
      const {
        course,
        sectionTitle,
        topic,
        subTopic,
        lectureTitle,
        lectureType,
        liveClass,
      } = req.body;

      // ✅ FIX 1: checkbox → boolean
      const isPreviewBool = req.body.isPreview === "on";

      let videoUrl = "";

      if (lectureType === "video" && req.file) {
        videoUrl = `/uploads/lectures/${req.file.filename}`;
      }

      await CourseContent.create({
        course,
        sectionTitle,
        topic,
        subTopic,
        lectureTitle,
        lectureType,
        videoUrl,
        liveClass: lectureType === "live" ? liveClass : undefined,
        isPreview: isPreviewBool, // ✅ FIXED
        isPublished: false,
      });

      res.redirect(`/admin/courses/${course}/lectures`);
    } catch (error) {
      console.error("LECTURE SAVE ERROR:", error);
      res.status(500).send(error.message);
    }
  }
);

export default router;

router.patch("/publish/:id", async (req, res) => {
  await CourseContent.findByIdAndUpdate(req.params.id, {
    isPublished: true,
  });
  res.sendStatus(200);
});

router.patch("/unpublish/:id", async (req, res) => {
  await CourseContent.findByIdAndUpdate(req.params.id, {
    isPublished: false,
  });
  res.sendStatus(200);
});
