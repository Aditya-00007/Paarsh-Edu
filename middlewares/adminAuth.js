export const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};
