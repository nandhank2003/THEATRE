// ===============================
// 👤 USER ROUTES — CLEAN (RESEND + JWT ONLY)
// ===============================

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { Resend } from "resend";

const router = express.Router();

// Lazily initialize Resend client to prevent startup crash if key is missing
let resend;
function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/* ==========================================
   🔑 Generate JWT Token
========================================== */
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

/* ==========================================
   👤 GET CURRENT USER
========================================== */
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

export default router;
