import express from "express";
import Company from "../models/Company.js";
import Placement from "../models/Placements.js";
import Interview from "../models/Interview.js";
import Enrollment from "../models/Enrollment.js"

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    //  STATS 
    const [
      placedCount,
      inProcessCount,
      closedCount
    ] = await Promise.all([
      Placement.countDocuments({ currentStatus: "placed" }),
      Placement.countDocuments({ currentStatus: "in_process" }),
      Placement.countDocuments({ currentStatus: "closed" })
    ]);

    //  ELIGIBLE ENROLLMENTS 
    const enrollments = await Enrollment.find({
      placementStatus: "active"
    })
      .populate("student", "name")
      .populate("course", "title")
      .sort({ updatedAt: -1 });

    // PLACEMENTS
    const placements = await Placement.find({
      enrollment: { $in: enrollments.map(e => e._id) }
    });

    const placementMap = {};
    placements.forEach(p => {
      placementMap[p.enrollment.toString()] = p;
    });

    const companies = await Company.find({ isActive: true })
      .sort({ name: 1 })
      .select("_id name");

  
    const interviews = await Interview.find({
      $or: enrollments.map(e => ({
        student: e.student._id,   //  MATCH BY STUDENT
        course: e.course._id      //  MATCH BY COURSE
      }))
    })
      .populate("student", "name")
      .populate("course", "title")
      .populate("company", "name")
      .sort({ scheduledAt: -1 }); //  LATEST FIRST (IMPORTANT)
   
   
    const interviewCountMap = {};
    const currentInterviewMap = {};

    interviews.forEach(i => {
      //  FIND ENROLLMENT FOR THIS INTERVIEW
      const enrollment = enrollments.find(e =>
        e.student._id.equals(i.student._id) &&
        e.course._id.equals(i.course._id)
      );

      if (!enrollment) return;

      const eid = enrollment._id.toString();

      //  COUNT INTERVIEWS PER ENROLLMENT
      interviewCountMap[eid] = (interviewCountMap[eid] || 0) + 1;

      //  SET CURRENT INTERVIEW (FIRST ONE DUE TO SORT)
      if (!currentInterviewMap[eid]) {
        currentInterviewMap[eid] = i;
      }
    });
    //  FINAL PLACEMENT TABLE 
    const placementTableData = enrollments.map(enrollment => {
      const eid = enrollment._id.toString();
      const placement = placementMap[eid];

      return {
        enrollmentId: eid,
        student: enrollment.student,
        course: enrollment.course,

        // placement info
        placementStatus: placement?.currentStatus || "not_started",
        callsUsed: placement?.callsUsed || 0,
        totalCallsAllowed: placement?.totalCallsAllowed || 4,
        placementId: placement?._id || null,

        //  INTERVIEW DATA (ENROLLMENT-WISE)
        interviewCount: interviewCountMap[eid] || 0,
        currentInterview: currentInterviewMap[eid] || null
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

    // BASIC VALIDATION 
    if (!name || !name.trim()) {
      return res.status(400).send("Company name is required");
    }

    //  DUPLICATE CHECK 
    const existingCompany = await Company.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existingCompany) {
      return res.status(400).send("Company already exists");
    }

    // - CREATE COMPANY --
    await Company.create({
      name,
      industry,
      location,
      hrName,
      hrEmail,
      companyEmail
    });

    //  SUCCESS 
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
      studentId,   //  received but will NOT be trusted
      companyId,
      scheduledAt,
      meetingLink,
      adminRemarks
    } = req.body;

    if (!enrollmentId || !companyId || !scheduledAt || !meetingLink) {
      return res.status(400).send("Missing required fields");
    }

    //  VALIDATE ENROLLMENT 
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.placementStatus !== "active") {
      return res.status(400).send("Placement not active");
    }

    //  DERIVE FROM ENROLLMENT 
    const derivedStudentId = enrollment.student;
    const derivedCourseId = enrollment.course;

    // FIND PLACEMENT 
    let placement = await Placement.findOne({
      enrollment: enrollmentId
    });

    //  CREATE PLACEMENT IF NOT EXISTS
    if (!placement) {
      placement = await Placement.create({
        enrollment: enrollmentId,
        callsUsed: 0,
        totalCallsAllowed: 4,
        currentStatus: "in_process"
      });
    }

    // CHECK INTERVIEW LIMIT
    if (placement.callsUsed >= placement.totalCallsAllowed) {
      return res.status(400).send("Maximum interview limit reached");
    }

    const interviewNo = placement.callsUsed + 1;

    //  CREATE INTERVIEW 
    await Interview.create({
      enrollment: enrollmentId,
      student: derivedStudentId,       
      course: derivedCourseId,         
      company: companyId,
      interviewNo,
      scheduledAt,
      meetingLink,
      adminRemarks,
      status: "scheduled",
      assignedBy: req.user?._id || null
    });

    //  UPDATE PLACEMENT 
    placement.callsUsed = interviewNo;
    placement.currentStatus = "in_process";
    await placement.save();

    res.redirect("/placement-management");

  } catch (error) {
    console.error("Assign interview error:", error);
    res.status(500).send("Server error while assigning interview");
  }
});

router.post("/:id/declare-result", async (req, res) => {
  try {
    const { status, companyFeedback, adminRemarks } = req.body;

    // VALIDATE STATUS 
    const allowedStatuses = ["placed", "not_placed", "absent"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    //  FETCH INTERVIEW 
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    //  PREVENT RE-DECLARATION 
    if (interview.status !== "scheduled" && interview.status !== "pending_result") {
      return res.status(400).json({
        message: "Interview result already declared"
      });
    }

    //  UPDATE INTERVIEW 
    interview.status = status;
    interview.companyFeedback = companyFeedback;
    interview.adminRemarks = adminRemarks;
    await interview.save();

    //  RESOLVE PLACEMENT SAFELY 
    let placement = null;

    if (interview.enrollment) {
      placement = await Placement.findOne({ enrollment: interview.enrollment });
    }

    if (!placement) {
      const enrollment = await Enrollment.findOne({
        student: interview.student,
        course: interview.course
      });
      if (enrollment) {
        placement = await Placement.findOne({ enrollment: enrollment._id });
      }
    }

    if (!placement) {
      return res.status(404).json({ message: "Placement not found" });
    }

    //  PLACEMENT STATUS LOGIC 

    //  CASE 1: STUDENT PLACED (FINAL STATE)
    if (status === "placed") {
      placement.currentStatus = "placed";
      placement.placedCompany = interview.company;
      placement.placedAt = new Date();
      await placement.save();

      return res.json({ success: true });
    }

    //  DO NOT DOWNGRADE IF ALREADY PLACED
    if (placement.currentStatus === "placed") {
      return res.json({ success: true });
    }

    //  CASE 2: NOT PLACED / ABSENT
    if (status === "not_placed" || status === "absent") {
      placement.currentStatus =
        placement.callsUsed >= placement.totalCallsAllowed
          ? "closed"        //  all 4 attempts failed
          : "in_process";   //  more attempts allowed

      await placement.save();
    }

    res.json({ success: true });

  } catch (err) {
    console.error("DECLARE RESULT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
