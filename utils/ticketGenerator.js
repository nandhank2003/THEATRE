import crypto from "crypto";
import QRCode from "qrcode";
import Ticket from "../models/Ticket.js";

// Helper to create a readable booking code
function generateBookingCode(booking) {
  const shortId = booking._id.toString().slice(-6).toUpperCase();
  return `MCB-${shortId}`;
}

function generateTicketId() {
  return "TIC-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

// 🟢 Generate ticket after successful payment
export async function generateTicket(booking) {
  // booking: populated with movie, screen, user
  const existing = await Ticket.findOne({ booking: booking._id });
  if (existing) return existing;

  const bookingCode = generateBookingCode(booking);
  const ticketId = generateTicketId();

  const verifyUrl = `${process.env.CLIENT_VERIFY_URL || "https://yourdomain.com"}/verify/${bookingCode}`;

  const qrCode = await QRCode.toDataURL(verifyUrl);

  const showTime = booking.bookingTime || new Date(); // fallback if showTime not stored separately

  const ticket = await Ticket.create({
    booking: booking._id,
    bookingId: bookingCode,
    ticketId,
    qrCode,
    used: false,
    movieTitle: booking.movie?.title || "Movie",
    screenName: booking.screen?.name || "Screen",
    seats: booking.seats || [],
    showTime,
    email: booking.user?.email || "",
  });

  return ticket;
}

// 🟡 Fetch ticket via Booking _id
export async function getTicketByBookingId(bookingId) {
  const ticket = await Ticket.findOne({ booking: bookingId });
  return ticket;
}
