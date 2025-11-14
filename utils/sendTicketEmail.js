// /utils/sendTicketEmail.js
import { Resend } from "resend";

// Lazily initialize Resend client to prevent startup crash if key is missing
let resend;
function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * Generates the premium HTML email template for the e-ticket
 */
function generateTicketHTML(user, booking, ticketData) {
  const movieTitle = booking.movie.title || "Movie";
  const posterUrl = booking.movie.poster || "https://via.placeholder.com/400x600/1a1a1a/ffffff?text=Movie+Poster";
  const screenName = booking.screen.name || "Screen";
  const seats = booking.seats.join(", ") || "N/A";
  const showtime = new Date(booking.movie.showtime);
  const dateStr = showtime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = showtime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const ticketId = booking._id || "N/A";
  const qrCode = ticketData.qrCode || "";
  const userName = user.firstName || user.name || "Guest";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Malabar Cinehub E-Ticket</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  
  <!-- Email Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Main Content -->
        <table width="1200" cellpadding="0" cellspacing="0" style="max-width: 1200px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <tr>
            <td>
              
              <!-- Greeting Section -->
              <table width="100%" cellpadding="40" cellspacing="0">
                <tr>
                  <td style="color: #ffffff; font-size: 24px; font-weight: 600;">
                    Hi ${userName},
                  </td>
                </tr>
                <tr>
                  <td style="color: #aaaaaa; font-size: 16px; padding: 0 40px 40px 40px; line-height: 1.6;">
                    Your booking is confirmed! Get ready for an incredible cinematic experience at Malabar Cinehub.
                  </td>
                </tr>
              </table>

              <!-- Ticket Design -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%); position: relative;">
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        
                        <!-- Left: Movie Poster -->
                        <td width="400" valign="top" style="padding-right: 40px;">
                          <div style="background: rgba(26, 26, 26, 0.6); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                            <img src="${posterUrl}" alt="${movieTitle}" style="width: 100%; height: 520px; object-fit: cover; display: block;" />
                          </div>
                        </td>

                        <!-- Right: Ticket Details -->
                        <td valign="top">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            
                            <!-- Header -->
                            <tr>
                              <td colspan="2" style="padding-bottom: 16px;">
                                <div style="font-size: 16px; letter-spacing: 4px; color: #FFA500; font-weight: 600; text-transform: uppercase;">
                                  E-TICKET
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-bottom: 32px;">
                                <div style="font-size: 14px; letter-spacing: 3px; color: #888888; font-weight: 500; text-transform: uppercase;">
                                  MALABAR CINEHUB
                                </div>
                              </td>
                            </tr>

                            <!-- Movie Title -->
                            <tr>
                              <td colspan="2" style="padding-bottom: 48px;">
                                <div style="font-size: 52px; font-weight: 700; color: #ffffff; letter-spacing: 1px; line-height: 1.1; text-transform: uppercase;">
                                  ${movieTitle}
                                </div>
                              </td>
                            </tr>

                            <!-- Details Grid -->
                            <tr>
                              <td width="50%" style="padding-bottom: 24px;">
                                <div style="font-size: 12px; color: #888888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">DATE</div>
                                <div style="font-size: 18px; color: #ffffff; font-weight: 600;">${dateStr}</div>
                              </td>
                              <td width="50%" style="padding-bottom: 24px;">
                                <div style="font-size: 12px; color: #888888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">TIME</div>
                                <div style="font-size: 18px; color: #ffffff; font-weight: 600;">${timeStr}</div>
                              </td>
                            </tr>
                            
                            <tr>
                              <td width="50%" style="padding-bottom: 48px;">
                                <div style="font-size: 12px; color: #888888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">SCREEN</div>
                                <div style="font-size: 18px; color: #ffffff; font-weight: 600;">${screenName}</div>
                              </td>
                              <td width="50%" style="padding-bottom: 48px;">
                                <div style="font-size: 12px; color: #888888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">SEATS</div>
                                <div style="font-size: 18px; color: #FFA500; font-weight: 700;">${seats}</div>
                              </td>
                            </tr>

                            <!-- QR Code and Ticket ID -->
                            <tr>
                              <td valign="bottom">
                                <div style="background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 16px; border: 1px solid rgba(255, 165, 0, 0.3); box-shadow: 0 4px 24px rgba(255, 165, 0, 0.15); display: inline-block;">
                                  <img src="${qrCode}" alt="QR Code" style="width: 180px; height: 180px; display: block;" />
                                  <div style="text-align: center; margin-top: 12px; font-size: 11px; color: #333333; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                                    SCAN AT ENTRY
                                  </div>
                                </div>
                              </td>
                              <td valign="bottom" align="right">
                                <div style="font-size: 11px; color: #666666; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase;">
                                  TICKET ID
                                </div>
                                <div style="font-size: 16px; color: #999999; font-family: monospace; letter-spacing: 1px;">
                                  ${ticketId}
                                </div>
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="40" cellspacing="0" style="background-color: #0a0a0a; border-top: 1px solid rgba(255, 165, 0, 0.2);">
                <tr>
                  <td style="color: #666666; font-size: 14px; text-align: center; line-height: 1.8;">
                    <p style="margin: 0 0 10px 0;">Please arrive 15 minutes before showtime.</p>
                    <p style="margin: 0; font-size: 12px; color: #555555;">
                      For support, contact us at support@malabarcinehub.com
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

/**
 * Sends a ticket email to the user after a successful booking.
 * This function is designed to be non-blocking.
 *
 * @param {object} user - The user object (must contain email, firstName).
 * @param {object} booking - The populated booking object.
 * @param {object} ticketData - The generated ticket data (must contain qrCode).
 * @returns {Promise<boolean>} - True if the email was sent successfully.
 */
export const sendTicketEmail = async (user, booking, ticketData) => {
  try {
    if (!user || !user.email) {
      console.error("sendTicketEmail: User or user email is missing.");
      return false;
    }

    const htmlContent = generateTicketHTML(user, booking, ticketData);

    const { data, error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "tickets@malabarcinehub.com",
      to: user.email,
      subject: `🎬 Your Ticket for ${booking.movie.title} - Malabar Cinehub`,
      html: htmlContent,
    });

    if (error) throw error;
    
    console.log("✅ Ticket email sent successfully to:", user.email);
    return true;
  } catch (error) {
    console.error("❌ RESEND Ticket Email Error:", error);
    return false;
  }
};