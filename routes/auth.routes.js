import express from "express";
import bcrypt from "bcrypt";
// bcrypt.hash("admin123", 10).then(console.log);


const router = express.Router();

// TEMP ADMIN (later you can move to DB)
const ADMIN = {
  email: "admin@gmail.com",
  password: "$2b$10$d5QFBeAKCaymBSvjr.7aseG.aw0keS0G9nRh4dbNOOlGvzyyXIKQC" // bcrypt hash
};

//loginpage
router.get("/login", (req, res) => {
  res.render("Backend/login.ejs", { error: null });
});

// Login logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN.email) {
    return res.render("Backend/login.ejs", { error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, ADMIN.password);
  if (!match) {
    return res.render("Backend/login.ejs", { error: "Invalid credentials" });
  }

  req.session.admin = true;
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

