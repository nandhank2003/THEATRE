// ===============================
// 👤 USER ROUTES — Theatre Booking (FINAL PASSWORD FIX)
// ===============================

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOTPEmail } from "../utils/sendOTP.js";

const router = express.Router();
const MIN_PASSWORD_LENGTH = 6;

const cleanPasswordValue = (rawPassword = "") =>
  rawPassword.normalize("NFC").trim();

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
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ joinedAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const cleanPassword = cleanPasswordValue(password);

    if (cleanPassword.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified)
      return res.status(400).json({ success: false, message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (user && !user.isVerified) {
      // Update profile + password if the user is re-registering before verification
      user.firstName = firstName?.trim() || user.firstName;
      user.lastName = lastName?.trim() || user.lastName;
      user.phone = phone?.trim() || user.phone;
      if (cleanPassword) {
        user.password = cleanPassword;
      }
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      await sendOTPEmail(normalizedEmail, otp);
      return res.json({ success: true, message: "🔄 OTP resent to your email" });
    }

    user = new User({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: cleanPassword,
      otp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000),
      isVerified: false,
    });

    await user.save();
    await sendOTPEmail(normalizedEmail, otp);

    res.status(201).json({
      success: true,
      message: "✅ OTP sent to your email. Please verify to activate your account.",
    });
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
    const cleanPassword = cleanPasswordValue(password);

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

    const cleanPassword = cleanPasswordValue(newPassword);

    if (cleanPassword.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.password = cleanPassword;
    await user.save();

    res.json({ success: true, message: "✅ Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
