// /utils/sendOTP.js
import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  try {
    // Gmail SMTP setup (requires App Password)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // OTP Email HTML
    const mailOptions = {
      from: `"MALABAR CINEHUB Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎬 MALABAR CINEHUB - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: #111; color: #fff;">
          <h2 style="text-align: center; color: #f39c12;">MALABAR CINEHUB Email Verification</h2>
          <p style="font-size: 16px;">Hello 👋,</p>
          <p style="font-size: 15px;">Use the following OTP to verify your MALABAR CINEHUB account. It will expire in <b>5 minutes</b>.</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 30px; letter-spacing: 4px; background: #f39c12; color: #000; padding: 10px 20px; border-radius: 8px; font-weight: bold;">${otp}</span>
          </div>
          <p>If you didn’t request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333;">
          <p style="font-size: 13px; text-align: center; color: #999;">© ${new Date().getFullYear()} MALABAR CINEHUB. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
  }
};
