import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "./models/Course.js";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const port=3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


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
  {res.render("dashboard.ejs", { title: "Dashboard" });
});

app.get("/dashboard", async (req, res) =>{
   res.render("dashboard.ejs", { title: "Dashboard" });
} 
 );

app.get("/course-management", async (req, res) =>{ 
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.render("courseManagement.ejs", { courses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load courses");
  }
});

app.get("/student-management", async (req, res) => 
{ res.render("studentManagement.ejs", { title: "Student Management" });
} );

app.get("/teacher-management", async (req, res) => 
  {res.render("teacherManagement.ejs", { title: "Teacher Management" })});

app.get("/enrollment-management", async (req, res) => 
  {res.render("enrollmentManagement.ejs", { title: "Enrollment Management" })});

app.get("/consent-management", async (req, res) => 
  {res.render("consentManagement.ejs", { title: "Consent Management" })});

app.get("/payments", async (req, res) => 
  {res.render("payments.ejs", { title: "Payments" })});

app.get("/enquiries", async (req, res) => 
  {res.render("enquiries.ejs", { title: "Enquiries" })});

app.get("/settings", async (req, res) => 
  {res.render("settings", { title: "Settings" });
});

app.post("/courses/add", async (req, res) => {
  try {
    const {
      name,
      fee,
      duration,
      intakeLimit,
      description,
      status,
      category,
    } = req.body;

    await Course.create({
      name,
      fee,
      duration,
      intakeLimit,
      description,
      status,
      category,
      enrolledCount: 0,        // default
      revenueGenerated: 0      // default
    });

    // redirect back to course list
    res.redirect("/course-management");

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add course");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});