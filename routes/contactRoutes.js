// /routes/contactRoutes.js
import express from "express";
import { Resend } from "resend";

const router = express.Router();

// Lazily initialize Resend client to prevent startup crash if key is missing
let resend;
function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * @desc    Handle contact form submission
 * @route   POST /api/contact
 * @access  Public
 */
router.post("/", async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  // Basic validation
  if (!firstName || !email || !subject || !message) {
    return res
      .status(400)
      .json({ message: "Please fill all required fields." });
  }

  // --- Admin Redirect Logic ---
  if (
    process.env.ADMIN_EMAIL_FOR_CONTACT_REDIRECT &&
    email.toLowerCase() ===
      process.env.ADMIN_EMAIL_FOR_CONTACT_REDIRECT.toLowerCase()
  ) {
    console.log(`🤫 Admin access triggered by email: ${email}`);
    return res.status(200).json({ isAdminRedirect: true });
  }

  // ----------------------------
  // SEND EMAIL USING RESEND
  // ----------------------------
  try {
    await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "noreply@yourdomain.com",
      to: process.env.CONTACT_EMAIL_RECIPIENT,
      subject: `New Contact Form Message: ${subject}`,
      reply_to: email,
      html: `
      <div style="font-family: Arial; line-height: 1.6;">
        <h2>📩 New Contact Form Message</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <h3>Message:</h3>
        <div style="padding:12px;background:#f5f5f5;border-radius:5px;">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <br>
        <p style="color:#777;font-size:12px;">
          Sent automatically from MALABAR CINEHUB contact form.
        </p>
      </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("❌ RESEND Contact Email Error:", error);
    return res.status(500).json({
      message: "Failed to send message. Please try again later.",
      error: error.message,
    });
  }
});

export default router;
