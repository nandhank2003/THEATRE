import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

/**
 * @desc    Handle contact form submission
 * @route   POST /api/contact
 * @access  Public
 */
router.post("/", async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  // Basic validation
  if (!firstName || !email || !subject || !message) {
    return res.status(400).json({ message: "Please fill all required fields." });
  }

  // --- Special Admin Redirect Logic ---
  // Check if the submitted email matches the secret admin email from .env
  if (email.toLowerCase() === process.env.ADMIN_EMAIL_FOR_CONTACT_REDIRECT?.toLowerCase()) {
    console.log(`🤫 Admin access triggered by email: ${email}`);
    // Send a special response that the frontend can use to redirect
    return res.status(200).json({ isAdminRedirect: true });
  }

  // --- Nodemailer Email Sending Logic (Port 465) ---
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${firstName} ${lastName}" <${process.env.EMAIL_USER}>`, // Send from your verified email
    to: process.env.CONTACT_EMAIL_RECIPIENT,
    replyTo: email, // Set the user's email as the reply-to address
    subject: `New Contact Form Message: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Message from MALABAR CINEHUB Contact Form</h2>
        <p>You have received a new message from your website's contact form.</p>
        <hr>
        <h3>Message Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
          <li><strong>Phone:</strong> ${phone || "Not provided"}</li>
        </ul>
        <h3>Message:</h3>
        <p style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, "<br>")}
        </p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">This email was sent from the contact form on your MALABAR CINEHUB website.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending contact email:", error);
    res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
});

export default router;