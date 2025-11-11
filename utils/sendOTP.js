// utils/sendOTP.js
import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  // --- Production Safety Check ---
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment variables.");
    console.log("📧 OTP Email not sent. Check Render environment configuration.");
    // Throw an error to be caught by the route handler
    throw new Error("Email service is not configured.");
  }

  try {
    // ✅ Gmail SMTP setup (App Password required)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // ✅ Use port 587 for STARTTLS
      secure: false, // `secure: false` is required for STARTTLS
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App Password (not your normal password)
      },
    });

    // ✅ OTP Email HTML Template
    const mailOptions = {
      from: `"MALABAR CINEHUB Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎬 MALABAR CINEHUB - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: #0b0b0b; color: #fff; border: 1px solid #222;">
          <h2 style="text-align: center; color: #f39c12;">MALABAR CINEHUB Email Verification</h2>
          <p style="font-size: 15px;">Hello 👋,</p>
          <p>Use the following OTP to verify your MALABAR CINEHUB account. It will expire in <b>5 minutes</b>.</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 28px; letter-spacing: 5px; background: #f39c12; color: #000; padding: 10px 25px; border-radius: 6px; font-weight: bold;">${otp}</span>
          </div>
          <p>If you didn’t request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333;">
          <p style="font-size: 12px; text-align: center; color: #999;">© ${new Date().getFullYear()} MALABAR CINEHUB. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Nodemailer Error: Failed to send OTP email.", error);
    console.error("💡 Tip: Ensure EMAIL_USER and EMAIL_PASS (App Password) are correct in Render and that 2FA is enabled on the Google account.");
    throw error; // Re-throw the error to be handled by the caller
  }
};
