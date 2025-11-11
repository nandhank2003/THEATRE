// utils/sendTicketEmail.js
import nodemailer from "nodemailer";

export const sendTicketEmail = async (user, booking, ticketData) => {
  // --- Production Safety Check ---
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment variables.");
    console.log("📧 Ticket Email not sent. Check Render environment configuration.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const bookingDate = new Date(booking.bookingTime);
    const formattedDate = bookingDate.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = bookingDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 🎨 Ticket Email Template
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Your MALABAR CINEHUB Ticket</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;">
      <h1 style="color:#fff;margin:0;">🎬 MALABAR CINEHUB</h1>
    </td></tr>
    <tr><td style="padding:30px;">
      <table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
        <tr><td style="text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);padding:25px;color:#fff;">
          <h2 style="margin:0;">🎫 Booking Confirmed!</h2>
          <p style="opacity:0.9;">Your ticket is ready</p>
        </td></tr>
        <tr><td style="text-align:center;padding:30px;">
          <img src="${booking.movie?.poster || "https://via.placeholder.com/300x450/667eea/ffffff?text=Movie"}"
               alt="${booking.movie?.title || "Movie"}"
               style="max-width:200px;width:100%;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
          <h3 style="color:#333;margin:15px 0 5px;">${booking.movie?.title || "Movie"}</h3>
        </td></tr>
        <tr><td style="padding:0 30px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;">
              <strong style="color:#667eea;">Ticket ID:</strong>
              <p style="margin:4px 0 0;font-weight:600;">${ticketData.ticketId || "N/A"}</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;">
              <strong style="color:#667eea;">Screen:</strong>
              <p style="margin:4px 0 0;">${booking.screen?.name || "N/A"}</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;">
              <strong style="color:#667eea;">Seats:</strong>
              <p style="margin:4px 0 0;font-weight:600;">${booking.seats.join(", ")}</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;">
              <strong style="color:#667eea;">Date & Time:</strong>
              <p style="margin:4px 0 0;">${formattedDate}</p>
              <p style="margin:0;color:#666;">${formattedTime}</p>
            </td></tr>
            <tr><td style="padding:10px 0;">
              <strong style="color:#667eea;">Total Amount:</strong>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;">₹${booking.totalAmount.toLocaleString("en-IN")}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding:25px;background:#fafafa;">
          <p style="margin:0 0 10px;color:#666;">Scan this QR code at the entry</p>
          <img src="${ticketData.qrCode}" alt="QR Code" style="width:180px;height:180px;padding:10px;background:#fff;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          <p style="margin:10px 0 0;color:#999;font-size:12px;">Show this code at the cinema for entry</p>
        </td></tr>
        <tr><td style="text-align:center;padding:20px;background:#fafafa;border-top:1px solid #eee;">
          <p style="margin:0;color:#666;font-size:13px;">
            Arrive at least 15 minutes before the show time.<br>
            Keep this email handy or show the QR code at entry.
          </p>
          <p style="margin:10px 0 0;color:#aaa;font-size:11px;">
            © ${new Date().getFullYear()} MALABAR CINEHUB. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"MALABAR CINEHUB" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎫 Your MALABAR CINEHUB Ticket - ${booking.movie?.title || "Movie"}`,
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent successfully to ${user.email}`);
    return true;
  } catch (error) {
    console.error("❌ Nodemailer Error (Port 465): Failed to send ticket email.", error);
    return false; // Do not break booking if email fails
  }
};
