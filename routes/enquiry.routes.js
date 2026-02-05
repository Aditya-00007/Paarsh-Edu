import express from "express";
import Enquiry from "../models/Enquiries.js"

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.render("Backend/Enquiry-Management.ejs", { enquiries });
  } catch (error) {
    console.error(error);
    res.render("Backend/Enquiry-Management.ejs", { enquiries: [] });
  }
});

export default router;
