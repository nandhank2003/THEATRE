// utils/sendOTP.js
import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  // --- Safety check for Brevo SMTP ---
  if (!process.env.BREVO_USER || !process.env.BREVO_PASS) {
    console.error("❌ Missing BREVO_USER or BREVO_PASS in environment variables.");
    console.log("📧 OTP Email not sent. Check Render Brevo environment configuration.");
    throw new Error("Brevo email service is not configured.");
  }

  try {
    // ✅ Use Brevo SMTP (Port 587 TLS)
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST || "smtp-relay.brevo.com",
      port: process.env.BREVO_PORT || 587,
      secure: false, // false for 587 (TLS)
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    // ✅ OTP Email HTML Template (same beautiful layout)
    const mailOptions = {
      from: `"MALABAR CINEHUB Verification" <${process.env.BREVO_USER}>`,
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
    console.error("❌ Brevo SMTP Error: Failed to send OTP email.", error);
    console.error("💡 Tip: Ensure BREVO_HOST, BREVO_USER, and BREVO_PASS are correct in Render.");
    throw error;
  }
};
