import express from "express";
import Course from "../models/Course.js";
import Category from "../models/Category.js";
import CourseContent from "../models/CourseContent.js";
import Lecture from "../models/lecture.js";
import Assignment from "../models/Assignment.js";
import Test from "../models/Test.js";
import { uploadLectureVideo } from "../utils/multerCloudinaryVideo.js";
import { uploadSyllabusPDF } from "../utils/multerCloudinary.js";


const router = express.Router();

// Manage Chart for course completion
router.get("/dashboard/course-stats", async (req, res) => {
  try {

    // Run ALL queries concurrently
    const [
      courses,
      syllabusCourses,
      assignmentCourses,
      testCourses
    ] = await Promise.all([
      Course.find().select("_id").lean(),
      CourseContent.distinct("course"),
      Assignment.distinct("course"),
      Test.distinct("course")
    ]);

    //  Convert to Sets for O(1) lookup
    const syllabusSet = new Set(syllabusCourses.map(id => id.toString()));
    const assignmentSet = new Set(assignmentCourses.map(id => id.toString()));
    const testSet = new Set(testCourses.map(id => id.toString()));

    let completed = 0;
    let inProgress = 0;

    let syllabusMissing = 0;
    let assignmentMissing = 0;
    let testMissing = 0;

    for (const course of courses) {
      const id = course._id.toString();

      const hasSyllabus = syllabusSet.has(id);
      const hasAssignment = assignmentSet.has(id);
      const hasTest = testSet.has(id);

      if (hasSyllabus && hasAssignment && hasTest) {
        completed++;
      } else {
        inProgress++;

        if (!hasSyllabus) syllabusMissing++;
        if (!hasAssignment) assignmentMissing++;
        if (!hasTest) testMissing++;
      }
    }

    res.json({
      completed,
      inProgress,
      health: {
        syllabusMissing,
        assignmentMissing,
        testMissing
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard stats failed" });
  }
});

// add new course
router.post("/courses/add",uploadSyllabusPDF.single("syllabusFile")
, async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      thumbnail,
      introVideo,
      duration,
      level,
      fee,
      intakeLimit,
      status,
      category,
      languages,
      tags,
      prerequisites,
      certificate,
      syllabusOverview,
      syllabusTopics,
    } = req.body;

    const courseData = {
      title,
      shortDescription,
      fullDescription,
      thumbnail,
      introVideo,
      duration,
      level,
      fee,
      intakeLimit,
      status,
      category,

      // arrays
      languages: languages ? languages.split(",").map((l) => l.trim()) : [],

      tags: tags ? tags.split(",").map((t) => t.trim()) : [],

      prerequisites: prerequisites
        ? prerequisites.split(",").map((p) => p.trim())
        : [],

      syllabusOverview,

      syllabusTopics: syllabusTopics
        ? syllabusTopics.split(",").map((t) => t.trim())
        : [],

      certificate: certificate === "true",

      enrolledCount: 0,
    };

    //  (Cloudinary)
    if (req.file) {
      courseData.syllabusFile = req.file.path; // Cloudinary URL
    }

    await Course.create(courseData);

    res.redirect("/course-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add course");
  }
});

// update course
router.post("/courses/update/:id", async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      fee: req.body.fee,
      duration: req.body.duration,
      intakeLimit: req.body.intakeLimit,
      status: req.body.status,
      category: req.body.category,
    };

    // Instructor (nested object)
    if (req.body.instructor) {
      updateData.instructor = {
        name: req.body.instructor.name,
        bio: req.body.instructor.bio,
        designation: req.body.instructor.designation,
      };
    }

    await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.redirect("/course-management");
  } catch (error) {
    console.error("COURSE UPDATE ERROR:", error);
    res.status(500).send("Failed to update course");
  }
});

// add category
router.post("/categories/add", async (req, res) => {
  try {
    const category = new Category({
      domain: req.body.domain,
      subDomain: req.body.subDomain,
      tagline: req.body.tagline,
      description: req.body.description,
      status: req.body.status || "active",
    });

    await category.save();
    res.redirect("/course-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add category");
  }
});

// add lecture
router.post(
  "/add-lecture",
  uploadLectureVideo.single("video"),
  async (req, res) => {
    try {
      const { course, syllabusItemId, lectureTitle, lectureType } = req.body;

      //  VALIDATIONS 
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

      //  PREVIEW 
      const isPreview = req.body.isPreview === "on";

      //  VIDEO HANDLING 
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

      //  LIVE CLASS HANDLING 
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

      //  AUTO LECTURE ORDER 
      const lastLecture = await Lecture.findOne({
        course,
        syllabusItemId,
      }).sort({ lectureOrder: -1 });

      const nextLectureOrder = lastLecture ? lastLecture.lectureOrder + 1 : 1;

      //  SAVE 
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

      //  REDIRECT 
      res.redirect(`/admin-course/courses/${course}/preview`);
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

    //  VALIDATION 
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

    //  AUTO ORDER 
    const lastAssignment = await Assignment.findOne({
      course,
      syllabusItemId,
    }).sort({ assignmentOrder: -1 });

    const nextOrder = lastAssignment ? lastAssignment.assignmentOrder + 1 : 1;

    //  SAVE 
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

    res.redirect(`/admin-course/courses/${course}/preview`);
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

    //  VALIDATION 
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

    //  SANITIZE QUESTIONS 
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctOptionIndex: Number(q.correctOptionIndex),
      marks: Number(q.marks || 1),
    }));

    //  AUTO ORDER 
    const lastTest = await Test.findOne({
      course,
      syllabusItemId,
    }).sort({ testOrder: -1 });

    const nextOrder = lastTest ? lastTest.testOrder + 1 : 1;

    //  SAVE 
    await Test.create({
      course,
      syllabusItemId,
      title,
      durationMinutes,
      questions: formattedQuestions,
      testOrder: nextOrder,
      isPublished: false,
    });

    res.redirect(`/admin-course/courses/${course}/preview`);
  } catch (error) {
    console.error("ADD TEST ERROR:", error);
    res.status(500).send("Failed to add test");
  }
});

/*  DELETE COURSE  */
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

/*  SAVE SYLLABUS  */
router.post("/syllabus/add", async (req, res) => {
  try {
    const { course, modules } = req.body;

    await CourseContent.deleteMany({ course });

    const syllabusDocs = modules.map((mod) => ({
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

/*  COURSE PREVIEW  */
router.get("/courses/:courseId/preview", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    const syllabus = await CourseContent.find({ course: courseId }).sort({
      moduleOrder: 1,
    });

    const lectures = await Lecture.find({ course: courseId }).sort({
      syllabusItemId: 1,
      lectureOrder: 1,
    });

    const assignments = await Assignment.find({ course: courseId }).sort({
      assignmentOrder: 1,
    });

    const tests = await Test.find({ course: courseId }).sort({ testOrder: 1 });

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

//send Syllabus
router.get("/syllabus/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const modules = await CourseContent.find({ course: courseId }).sort({
      moduleOrder: 1,
    });

    res.json({ modules }); //  modules array
  } catch (err) {
    console.error(err);
    res.status(500).json({ modules: [] });
  }
});

//add module
router.post("/syllabus/module/add", async (req, res) => {
  const { courseId, moduleTitle, order } = req.body;

  const modules = await CourseContent.find({ course: courseId });

  const finalOrder =
    order && Number(order) > 0 ? Number(order) : modules.length + 1;

  // shift modules
  await CourseContent.updateMany(
    { course: courseId, moduleOrder: { $gte: finalOrder } },
    { $inc: { moduleOrder: 1 } },
  );

  await CourseContent.create({
    course: courseId,
    moduleTitle,
    moduleOrder: finalOrder,
    items: [],
  });

  res.sendStatus(200);
});

//delete module
router.delete("/syllabus/module/delete/:moduleId", async (req, res) => {
  const { moduleId } = req.params;

  const module = await CourseContent.findById(moduleId);
  if (!module) return res.sendStatus(404);

  const itemIds = module.items.map((i) => i._id);

  await Lecture.deleteMany({ syllabusItemId: { $in: itemIds } });
  await Assignment.deleteMany({ syllabusItemId: { $in: itemIds } });
  await Test.deleteMany({ syllabusItemId: { $in: itemIds } });

  await CourseContent.findByIdAndDelete(moduleId);

  res.sendStatus(200);
});

// Add item
router.post("/syllabus/item/add", async (req, res) => {
  try {
    const { moduleId, itemType, title, order } = req.body;

    if (!moduleId || !itemType || !title) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const module = await CourseContent.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // decide final order
    let finalOrder;
    if (order && Number(order) > 0) {
      finalOrder = Number(order);
    } else {
      finalOrder = module.items.length + 1;
    }

    // 1️ SHIFT existing items
    await CourseContent.updateOne(
      { _id: moduleId },
      {
        $inc: {
          "items.$[item].order": 1,
        },
      },
      {
        arrayFilters: [{ "item.order": { $gte: finalOrder } }],
      },
    );

    // 2️ INSERT new item
    await CourseContent.findByIdAndUpdate(
      moduleId,
      {
        $push: {
          items: {
            itemType,
            title,
            order: finalOrder,
          },
        },
      },
      { runValidators: true },
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ADD ITEM WITH SHIFT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// Edit item
router.put("/syllabus/item/edit/:itemId", async (req, res) => {
  const { title } = req.body;
  const { itemId } = req.params;

  await CourseContent.updateOne(
    { "items._id": itemId },
    {
      $set: {
        "items.$.title": title,
      },
    },
  );

  res.sendStatus(200);
});

// Delete item
router.delete("/syllabus/item/delete/:itemId", async (req, res) => {
  const { itemId } = req.params;

  // Remove related data
  await Lecture.deleteMany({ syllabusItemId: itemId });
  await Assignment.deleteMany({ syllabusItemId: itemId });
  await Test.deleteMany({ syllabusItemId: itemId });

  // Remove from syllabus
  await CourseContent.updateOne(
    { "items._id": itemId },
    {
      $pull: {
        items: { _id: itemId },
      },
    },
  );

  res.sendStatus(200);
});

//assigmnet and test edit
router.put("/assignment/update/:id", async (req, res) => {
  await Assignment.findByIdAndUpdate(req.params.id, req.body);
  res.sendStatus(200);
});

router.delete("/assignment/delete/:id", async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

router.delete("/test/delete/:id", async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

router.put("/test/update/:id", async (req, res) => {
  await Test.findByIdAndUpdate(req.params.id, req.body);
  res.sendStatus(200);
});

export default router;
