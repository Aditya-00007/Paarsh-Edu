import express from "express";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js"; 

const router = express.Router();

//loginpage
router.get("/login", (req, res) => {
  res.render("Backend/login.ejs", { error: null });
});

// Login logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ADMIN FROM DB
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.render("Backend/login.ejs", { error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return res.render("Backend/login.ejs", { error: "Invalid credentials" });
  }

  // 
  req.session.admin = true;

  //  t safe 
  admin.lastLoginAt = new Date();
  await admin.save();

  res.redirect("/dashboard");
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/dashboard");
    }
    res.redirect("/");
  });
});

export default router;
