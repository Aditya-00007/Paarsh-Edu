import express from "express";
import Company from "../models/Company.js";
import Placement from "../models/Placements.js";
import Interview from "../models/Interview.js";
import Enrollment from "../models/Enrollment.js"

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // ---------------- STATS (Placement-based) ----------------
    const [
      placedCount,
      inProcessCount,
      closedCount
    ] = await Promise.all([
      Placement.countDocuments({ currentStatus: "placed" }),
      Placement.countDocuments({ currentStatus: "in_process" }),
      Placement.countDocuments({ currentStatus: "closed" })
    ]);

    // ---------------- ELIGIBLE ENROLLMENTS ----------------
    const enrollments = await Enrollment.find({
      placementStatus: "active"
    })
      .populate("student", "name")
      .populate("course", "title")
      .sort({ updatedAt: -1 });

    // ==================== 🔽 UPDATED: PLACEMENT FETCH 🔽 ====================
    // Placement is now tied to enrollment (NOT student)
    const placements = await Placement.find({
      enrollment: { $in: enrollments.map(e => e._id) }
    });
    // ==================== 🔼 UPDATED: PLACEMENT FETCH 🔼 ====================

    // ==================== 🔽 UPDATED: MAP BY ENROLLMENT 🔽 ====================
    const placementMap = {};
    placements.forEach(p => {
      placementMap[p.enrollment.toString()] = p;
    });
    // ==================== 🔼 UPDATED: MAP BY ENROLLMENT 🔼 ====================

    const companies = await Company.find({ isActive: true })
      .sort({ name: 1 })
      .select("_id name");

    // ---------------- INTERVIEW FETCH (SOURCE OF TRUTH) ----------------
    const interviews = await Interview.find({
      enrollment: { $in: enrollments.map(e => e._id) }
    })
      .populate("student", "name")
      .populate("course", "title")
      .populate("company", "name")
      .sort({ scheduledAt: -1 });

    // ---------------- BUILD INTERVIEW COUNT MAP (ENROLLMENT-BASED) ----------------
    const interviewCountMap = {};
    interviews.forEach(i => {
      const eid = i.enrollment?.toString();
      if (!eid) return;

      if (!interviewCountMap[eid]) interviewCountMap[eid] = 0;
      interviewCountMap[eid]++;
    });

    // ---------------- FINAL PLACEMENT TABLE DATA ----------------
    const placementTableData = enrollments.map(enrollment => {
      const placement = placementMap[enrollment._id.toString()];

      return {
        enrollmentId: enrollment._id.toString(),
        student: enrollment.student,
        course: enrollment.course,

        // placement info
        placementStatus: placement?.currentStatus || "not_started",
        callsUsed: placement?.callsUsed || 0,
        totalCallsAllowed: placement?.totalCallsAllowed || 4,
        placementId: placement?._id || null,

        // interview support
        interviewCount: interviewCountMap[enrollment._id.toString()] || 0
      };
    });

    res.render("Backend/placementManagement.ejs", {
      stats: {
        totalEligible: enrollments.length,
        placedCount,
        inProcessCount,
        closedCount
      },
      placements: placementTableData,
      interviews,
      companies
    });

  } catch (error) {
    console.error("Placement page error:", error);
    res.status(500).send("Server Error");
  }
});

 // add company
router.post("/company/add", async (req, res) => {
  try {
    const { name, industry, location, hrName, hrEmail,companyEmail } = req.body;

    // --------- BASIC VALIDATION ----------
    if (!name || !name.trim()) {
      return res.status(400).send("Company name is required");
    }

    // --------- DUPLICATE CHECK ----------
    const existingCompany = await Company.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existingCompany) {
      return res.status(400).send("Company already exists");
    }

    // --------- CREATE COMPANY ----------
    await Company.create({
      name,
      industry,
      location,
      hrName,
      hrEmail,
      companyEmail
    });

    // --------- SUCCESS ----------
    res.redirect("/placement-management/");

  } catch (error) {
    console.error("Add company error:", error);
    res.status(500).send("Server error while adding company");
  }
});
// assign interview
router.post("/interview/add", async (req, res) => {
  try {
    const {
      enrollmentId,
      studentId,
      companyId,
      scheduledAt,
      meetingLink,
      adminRemarks
    } = req.body;

    if (!enrollmentId || !studentId || !companyId || !scheduledAt || !meetingLink) {
      return res.status(400).send("Missing required fields");
    }

    // ---------------- VALIDATE ENROLLMENT ----------------
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.placementStatus !== "active") {
      return res.status(400).send("Placement not active");
    }

    const courseId = enrollment.course;

    // ---------------- FIND PLACEMENT (ENROLLMENT-BASED) ----------------
    let placement = await Placement.findOne({
      enrollment: enrollmentId
    });

    // ---------------- CREATE PLACEMENT IF NOT EXISTS ----------------
    if (!placement) {
      placement = await Placement.create({
        enrollment: enrollmentId,     // ✅ only required identifier
        callsUsed: 0,
        totalCallsAllowed: 4,
        currentStatus: "in_process"
      });
    }

    // ---------------- CHECK INTERVIEW LIMIT ----------------
    if (placement.callsUsed >= placement.totalCallsAllowed) {
      return res.status(400).send("Maximum interview limit reached");
    }

    const interviewNo = placement.callsUsed + 1;

    // ---------------- CREATE INTERVIEW ----------------
    await Interview.create({
      enrollment: enrollmentId,       // ✅ IMPORTANT (for filtering & counts)
      student: studentId,
      course: courseId,
      company: companyId,
      interviewNo,
      scheduledAt,
      meetingLink,
      adminRemarks,
      assignedBy: req.user?._id || null
    });

    // ---------------- UPDATE PLACEMENT ----------------
    placement.callsUsed = interviewNo;
    placement.currentStatus = "in_process";
    await placement.save();

    res.redirect("/placement-management");

  } catch (error) {
    console.error("Assign interview error:", error);
    res.status(500).send("Server error while assigning interview");
  }
});


export default router;
