import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "./models/Course.js";
import Category from "./models/Category.js";
import bodyParser from "body-parser";
import courseContentRoutes from "./routes/courseContent.routes.js";
import adminRoutes from "./routes/admin.routes.js";


dotenv.config();
const app = express();
const port=3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/course-content", courseContentRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB Atlas connected");
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });


// Routes
app.get("/", async (req, res) => 
  {res.render("backend/dashboard.ejs", { title: "Dashboard" });
});

app.get("/dashboard", async (req, res) =>{
   res.render("backend/dashboard.ejs", { title: "Dashboard" });
} 
 );

app.get("/course-management", async (req, res) =>{ 
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    const categories = await Category.find({ status: "active" });
    res.render("backend/courseManagement.ejs", { courses,categories});
  } catch (err) {
    console.error(err);
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

// add new course
app.post("/courses/add", async (req, res) => {
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
    } = req.body;

    await Course.create({
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

      // convert comma-separated strings → arrays
      languages: languages
        ? languages.split(",").map(l => l.trim())
        : [],

      tags: tags
        ? tags.split(",").map(t => t.trim())
        : [],

      prerequisites: prerequisites
        ? prerequisites.split(",").map(p => p.trim())
        : [],

      certificate: certificate === "true",

      enrolledCount: 0,
    });

    res.redirect("/course-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add course");
  }
});


// update course
app.post("/admin/courses/update/:id", async (req, res) => {
  try {
    await Course.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        fee: req.body.fee,
        duration: req.body.duration,
        intakeLimit: req.body.intakeLimit,
        fullDescription: req.body.fullDescription,
        status: req.body.status,
        category: req.body.category,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.redirect("/course-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update course");
  }
});


// add category
app.post("/admin/categories/add", async (req, res) => {
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



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});