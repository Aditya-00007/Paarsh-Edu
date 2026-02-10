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
import session from "express-session";
import authRoutes from "./routes/auth.routes.js";
import { adminAuth } from "./middlewares/adminAuth.js";
import enquiryRoutes from "./routes/enquiry.routes.js"
import methodOverride from "method-override"
import adminStudentsRoutes from "./routes/adminStudents.js"
import studentManagementRoutes from "./routes/studentManagement.js"
import Student from "./models/Student.js";
import Enrollment from "./models/Enrollment.js";
import Enquiries from "./models/Enquiries.js";
import Blog from "./models/Blog.js";
import PlacemntRoutes from "./routes/placements.routes.js"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(
  session({
    secret: "admin-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use("/admin-course", adminAuth, adminCourseRoutes);
app.use("/admin/blogs", adminAuth, blogRoutes);
app.use("/student-management", adminAuth, studentRoutes);
app.use(express.static("public"));
app.use("/enquiries", adminAuth, enquiryRoutes);
app.use("/placement-management", adminAuth, PlacemntRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB Atlas connected");
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });

// auth routes
app.use("/auth", authRoutes);
//  Student Management (Enrollment-based views)
app.use(studentManagementRoutes);


//  Admin student routes


// Routes
app.get("/", (req, res) => {
  if (req.session.admin) {
    return res.redirect("/dashboard");
  }
  res.render("Backend/login.ejs", { error: null });
});

app.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const courses = await Course.find().sort({ createdAt: -1 });
    const categories = await Category.find({ status: "active" });

    // TOTAL COUNTS
    const totalStudents = await Student.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalEnquirires = await Enquiries.countDocuments();

    // TODAY COUNTS
    const todayStudents = await Student.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const todayEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: todayStart }
    });

    const todayCourses = await Course.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const todayBlogs = await Blog.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const placementEligibleStudents = await Enrollment.countDocuments({
      placementStatus: "active"
    });

    let enrollments = await Enrollment.find()
      .populate("student", "name")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .lean();

    enrollments = enrollments.filter(e => e.student && e.course);

    const enquiries = await Enquiries.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.render("Backend/dashboard.ejs", {
      courses,
      categories,
      totalEnrollments,
      totalStudents,
      totalEnquirires,
      enrollments,
      enquiries,

      // TODAY SUMMARY
      todayStudents,
      todayEnrollments,
      todayCourses,
      placementEligibleStudents,
      todayBlogs
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load Content");
  }
});

app.get("/course-management", adminAuth, async (req, res) => {
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

    res.render("Backend/courseManagement.ejs", {
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

app.use("/", adminStudentsRoutes);



app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
