// ===============================
// 👤 USER ROUTES — Theatre Booking (FINAL PASSWORD FIX)
// ===============================

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOTPEmail } from "../utils/sendOTP.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ==========================================
   🔑 Generate JWT Token
   ========================================== */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "default_secret_key", {
    expiresIn: "30d",
  });

/* ==========================================
   📋 ADMIN — Get All Users
   ========================================== */
// This route is now handled by /api/admin/users for better security
// router.get("/", async (req, res) => { ... });

/* ==========================================
   👤 GET CURRENT USER (SESSION OR TOKEN)
   ========================================== */
router.get("/me", protect, (req, res) => {
  // The 'protect' middleware ensures req.user is populated
  // for both session and token-based authentication.
  if (req.user) {
    res.json(req.user);
  } else {
    // This case should theoretically not be reached if 'protect' is working.
    res.status(401).json({ message: "Not authenticated" });
  }
});

/* ==========================================
   📨 REGISTER — Create User & Send OTP (Final Fixed)
   ========================================== */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Clean password to prevent invisible or trailing chars
    const cleanPassword = password.normalize("NFC").trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified)
      return res.status(400).json({ success: false, message: "User already exists" });

    if (user && !user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      await sendOTPEmail(normalizedEmail, otp);
      return res.json({ success: true, message: "🔄 OTP resent to your email" });
    }

    // ✅ Always hash clean password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user = new User({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: hashedPassword,
      otp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000),
      isVerified: false,
    });

    await user.save();
    
    // ✅ Send OTP but don't let a failure block the user
    try {
      await sendOTPEmail(normalizedEmail, otp);
      res.status(201).json({
        success: true,
        message: "✅ OTP sent to your email. Please verify to activate your account.",
      });
    } catch (emailError) {
      console.error("⚠️ OTP email failed to send, but proceeding for UX.", emailError.message);
      // Still send a success response so the user can move to the OTP screen and use "Resend"
      res.status(201).json({
        success: true,
        message: "OTP sent. If you don't receive it, please use the resend button.",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   🔑 LOGIN — Clean Password Compare (Final Fixed)
   ========================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Clean user-entered password before comparison
    const cleanPassword = password.normalize("NFC").trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ success: false, message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(cleanPassword, user.password);

    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid password" });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "✅ Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   🔐 VERIFY OTP
   ========================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (new Date(user.otpExpires).getTime() < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: "✅ Email verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   🔧 RESET PASSWORD (Permanent Feature)
   ========================================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const cleanPassword = newPassword.normalize("NFC").trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "✅ Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
