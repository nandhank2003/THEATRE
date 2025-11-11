import express from "express";
import passport from "passport";

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login-form/login.html" }),
  (req, res) => {
    // Successful authentication. Check if user is an admin.
    if (req.user && req.user.isAdmin) {
      // If admin, redirect to the admin dashboard
      res.redirect("/admin/admin.html");
    } else {
      // If regular user, redirect to the home page
      res.redirect("/");
    }
  }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get("/logout", (req, res, next) => {
  // Passport.js provides a req.logout() function.
  req.logout(function(err) {
    if (err) { return next(err); }
    // On successful logout, you can clear any client-side storage
    // and redirect. The session is now destroyed.
    res.redirect('/login-form/login.html');
  });
});

export default router;