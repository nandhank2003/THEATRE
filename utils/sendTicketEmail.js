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

    // Create beautiful HTML email template with black & grey liquid theme
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MALABAR CINEHUB Ticket</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background: linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #000000 100%); position: relative;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2);">🎬 MALABAR CINEHUB</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #2d2d2d 100%); text-align: center; position: relative; border-bottom: 2px solid rgba(255,255,255,0.1);">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at top, rgba(255,255,255,0.05) 0%, transparent 70%);"></div>
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; text-shadow: 0 0 20px rgba(255,255,255,0.3); position: relative; z-index: 1;">🎫 Booking Confirmed!</h2>
              <p style="color: rgba(255,255,255,0.7); margin: 12px 0 0; font-size: 16px; position: relative; z-index: 1;">Your ticket is ready</p>
            </td>
          </tr>
          
          <!-- Movie Poster & Details -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(26,26,26,0.5) 100%);">
              <div style="display: inline-block; position: relative;">
                <img src="${booking.movie?.poster || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Movie'}" 
                     alt="${booking.movie?.title || 'Movie'}" 
                     style="max-width: 200px; width: 100%; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.05);">
              </div>
              <h3 style="color: #ffffff; margin: 0 0 10px; font-size: 24px; font-weight: 600; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">${booking.movie?.title || 'Movie'}</h3>
            </td>
          </tr>
          
          <!-- Ticket Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden; backdrop-filter: blur(10px);">
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg, rgba(45,45,45,0.3) 0%, rgba(26,26,26,0.3) 100%);">
                    <strong style="color: #b8b8b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Ticket ID</strong>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; font-weight: 600; text-shadow: 0 0 10px rgba(255,255,255,0.2);">${ticketData.ticketId || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg, rgba(26,26,26,0.3) 0%, rgba(45,45,45,0.3) 100%);">
                    <strong style="color: #b8b8b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Screen</strong>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">${booking.screen?.name || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg, rgba(45,45,45,0.3) 0%, rgba(26,26,26,0.3) 100%);">
                    <strong style="color: #b8b8b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Seats</strong>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; font-weight: 600;">${booking.seats.join(", ")}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg, rgba(26,26,26,0.3) 0%, rgba(45,45,45,0.3) 100%);">
                    <strong style="color: #b8b8b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Date & Time</strong>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">${formattedDate}</p>
                    <p style="margin: 5px 0 0; color: #999999; font-size: 14px;">${formattedTime}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: linear-gradient(90deg, rgba(45,45,45,0.5) 0%, rgba(26,26,26,0.5) 100%);">
                    <strong style="color: #b8b8b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Total Amount</strong>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 22px; font-weight: 700; text-shadow: 0 0 15px rgba(255,255,255,0.3);">₹${booking.totalAmount.toLocaleString('en-IN')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(180deg, rgba(13,13,13,0.5) 0%, rgba(0,0,0,0.8) 100%); border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0 0 20px; color: #b8b8b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Scan this QR code at the entry</p>
              <div style="display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%); padding: 20px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1px rgba(255,255,255,0.1);">
                <img src="${ticketData.qrCode}" 
                     alt="QR Code" 
                     style="width: 200px; height: 200px; display: block; border-radius: 8px;">
              </div>
              <p style="margin: 20px 0 0; color: #808080; font-size: 12px;">Present this QR code at the cinema for entry</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(13,13,13,0.9) 100%); text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0; color: #b8b8b8; font-size: 13px; line-height: 1.8;">
                <strong style="color: #ffffff;">Important:</strong> Please arrive at least 15 minutes before the show time.<br>
                Keep this email handy or show the QR code from your account.
              </p>
              <p style="margin: 20px 0 0; color: #666666; font-size: 11px; letter-spacing: 0.5px;">
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