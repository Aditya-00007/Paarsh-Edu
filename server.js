import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "./models/Course.js";
import Category from "./models/Category.js";
import adminCourseRoutes from "./routes/admin-course.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import studentRoutes from "./routes/student.routes.js"
import CourseContent from "./models/CourseContent.js";
import Assignment from "./models/Assignment.js";
import Test from "./models/Test.js";

dotenv.config();
const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/admin-course", adminCourseRoutes);
app.use("/admin/blogs", blogRoutes);
app.use("/student-management", studentRoutes);
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB Atlas connected");
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });

// Routes
app.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    const categories = await Category.find({ status: "active" });
    res.render("backend/dashboard.ejs", { courses, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load Content");
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    const categories = await Category.find({ status: "active" });
    res.render("backend/dashboard.ejs", { courses, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load Content");
  }
});

app.get("/course-management", async (req, res) => {
  try {
    const [courses, categories, syllabusCourses, assignmentCourses, testCourses] =
      await Promise.all([
        Course.find().sort({ createdAt: -1 }).lean(),
        Category.find({ status: "active" }).lean(),
        CourseContent.distinct("course"),
        Assignment.distinct("course"),
        Test.distinct("course")
      ]);

    const syllabusSet = new Set(syllabusCourses.map(id => id.toString()));
    const assignmentSet = new Set(assignmentCourses.map(id => id.toString()));
    const testSet = new Set(testCourses.map(id => id.toString()));

    let completed = 0;
    let inProgress = 0;

    for (const course of courses) {
      const id = course._id.toString();
      if (
        syllabusSet.has(id) &&
        assignmentSet.has(id) &&
        testSet.has(id)
      ) {
        completed++;
      } else {
        inProgress++;
      }
    }

    res.render("backend/courseManagement.ejs", {
      courses,
      categories,
      editCourseId: req.query.editCourse || null,
      completedCourses: completed,
      inProgressCourses: inProgress
    });
  } catch (err) {
    console.error(" Course Management Error:", err);
    res.status(500).send("Failed to load courses");
  }
});


// app.get("/student-management", async (req, res) =>
// { res.render("studentManagement.ejs", { title: "Student Management" });
// } );

// app.get("/teacher-management", async (req, res) =>
//   {res.render("teacherManagement.ejs", { title: "Teacher Management" })});

// app.get("/enrollment-management", async (req, res) =>
//   {res.render("enrollmentManagement.ejs", { title: "Enrollment Management" })});

// app.get("/consent-management", async (req, res) =>
//   {res.render("consentManagement.ejs", { title: "Consent Management" })});

// app.get("/payments", async (req, res) =>
//   {res.render("payments.ejs", { title: "Payments" })});

// app.get("/enquiries", async (req, res) =>
//   {res.render("enquiries.ejs", { title: "Enquiries" })});

// app.get("/settings", async (req, res) =>
//   {res.render("settings", { title: "Settings" });
// });



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
