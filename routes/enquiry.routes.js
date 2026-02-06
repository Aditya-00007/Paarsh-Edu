import express from "express";
import Enquiry from "../models/Enquiries.js";

const router = express.Router();

/* 
   ENQUIRY LIST PAGE
 */
router.get("/", async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.render("Backend/Enquiry-Management", { enquiries });
  } catch (error) {
    console.error(error);
    res.render("Backend/Enquiry-Management", { enquiries: [] });
  }
});

/* 
   VIEW SINGLE ENQUIRY
 */
router.get("/:id", async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.redirect("/enquiries");
    }

    res.render("Backend/enquiry-view", { enquiry });
  } catch (error) {
    console.error(error);
    res.redirect("/enquiries");
  }
});

/* 
   UPDATE ENQUIRY
 */
router.put("/:id", async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    const updateData = {
      status,
      adminRemark,
      updatedAt: new Date()
    };

    // auto set contactedAt
    if (status === "contacted") {
      updateData.contactedAt = new Date();
    }

    await Enquiry.findByIdAndUpdate(req.params.id, updateData);

    res.redirect(`/enquiries/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.redirect("/enquiries");
  }
});

export default router;
