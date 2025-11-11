import nodemailer from "nodemailer";

export const sendTicketEmail = async (user, booking, ticketData) => {
  try {
    // Use the same transporter as OTP emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
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

    // Create beautiful HTML email template
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MALABAR CINEHUB Ticket</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎬 MALABAR CINEHUB</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🎫 Booking Confirmed!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your ticket is ready</p>
            </td>
          </tr>
          
          <!-- Movie Poster & Details -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <img src="${booking.movie?.poster || 'https://via.placeholder.com/300x450/667eea/ffffff?text=Movie'}" 
                   alt="${booking.movie?.title || 'Movie'}" 
                   style="max-width: 200px; width: 100%; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
              <h3 style="color: #333; margin: 0 0 10px; font-size: 22px; font-weight: 600;">${booking.movie?.title || 'Movie'}</h3>
            </td>
          </tr>
          
          <!-- Ticket Details -->
          <tr>
            <td style="padding: 0 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket ID</strong>
                    <p style="margin: 5px 0 0; color: #333; font-size: 16px; font-weight: 600;">${ticketData.ticketId || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Screen</strong>
                    <p style="margin: 5px 0 0; color: #333; font-size: 16px;">${booking.screen?.name || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Seats</strong>
                    <p style="margin: 5px 0 0; color: #333; font-size: 16px; font-weight: 600;">${booking.seats.join(", ")}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</strong>
                    <p style="margin: 5px 0 0; color: #333; font-size: 16px;">${formattedDate}</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${formattedTime}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px;">
                    <strong style="color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</strong>
                    <p style="margin: 5px 0 0; color: #333; font-size: 20px; font-weight: 700;">₹${booking.totalAmount.toLocaleString('en-IN')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 30px; text-align: center; background: #f8f9fa;">
              <p style="margin: 0 0 15px; color: #666; font-size: 14px; font-weight: 600;">Scan this QR code at the entry</p>
              <img src="${ticketData.qrCode}" 
                   alt="QR Code" 
                   style="width: 200px; height: 200px; background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 15px 0 0; color: #999; font-size: 12px;">Present this QR code at the cinema for entry</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #f8f9fa; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.6;">
                <strong>Important:</strong> Please arrive at least 15 minutes before the show time.<br>
                Keep this email handy or show the QR code from your account.
              </p>
              <p style="margin: 15px 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} MALABAR CINEHUB. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"MALABAR CINEHUB" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎫 Your MALABAR CINEHUB Ticket - ${booking.movie?.title || 'Movie'}`,
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent successfully to ${user.email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending ticket email:", error.message);
    // Don't throw error - email failure shouldn't break the booking
    return false;
  }
};




