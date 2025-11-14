// /routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Resend } from "resend";

const router = express.Router();

// Temporary OTP store
let otpStore = {};

// Lazy Resend client
let resendClient;
function getResend() {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/* Generate JWT */
const generateToken = (userId, email, isAdmin = false) => {
  return jwt.sign(
    { id: userId, email, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ======================================================
   1️⃣ REGISTER — SEND OTP
====================================================== */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password)
      return res.status(400).json({ message: "All fields required." });

    const normalized = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalized });
    if (exists)
      return res.status(400).json({ message: "Email already registered." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[normalized] = {
      firstName,
      lastName,
      email: normalized,
      phone,
      password,
      otp,
      expires: Date.now() + 5 * 60 * 1000
    };

    // SEND OTP EMAIL
    await getResend().emails.send({
      from: "onboarding@resend.dev",   // FIXED**
      to: normalized,
      subject: "Your MALABAR CINEHUB OTP",
      html: `
        <h2>MALABAR CINEHUB Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:4px">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
    });

    res.json({ success: true, message: "OTP sent!" });

  } catch (err) {
    console.error("OTP SEND ERROR:", err);
    res.status(500).json({ message: "Server error sending OTP." });
  }
});

/* ======================================================
   2️⃣ VERIFY OTP — CREATE ACCOUNT
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email & OTP required." });

    const normalized = email.trim().toLowerCase();

    if (!otpStore[normalized])
      return res.status(400).json({ message: "OTP expired or invalid." });

    const record = otpStore[normalized];

    if (Date.now() > record.expires) {
      delete otpStore[normalized];
      return res.status(400).json({ message: "OTP expired." });
    }

    if (record.otp !== otp)
      return res.status(400).json({ message: "Incorrect OTP." });

    // Hash password
    const hashedPassword = await bcrypt.hash(record.password, 10);

    // Create user
    const newUser = await User.create({
      firstName: record.firstName,
      lastName: record.lastName,
      email: normalized,
      phone: record.phone,
      password: hashedPassword,
      isVerified: true,
      isAdmin: false
    });

    delete otpStore[normalized];

    const token = generateToken(newUser._id, newUser.email, newUser.isAdmin);

    res.json({
      success: true,
      message: "Email verified!",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error verifying OTP." });
  }
});

/* ======================================================
   3️⃣ LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalized });
    if (!user)
      return res.status(400).json({ message: "Email not registered." });

    if (!user.isVerified)
      return res.status(403).json({ message: "Verify email first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password." });

    const token = generateToken(user._id, user.email, user.isAdmin);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server login error." });
  }
});

export default router;
