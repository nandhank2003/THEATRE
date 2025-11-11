import QRCode from "qrcode";
import Booking from "../models/Booking.js";

export async function generateTicket(booking) {
  try {
    // Generate unique ticket ID
    const ticketId = `TKT-${booking._id.toString().slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    // Create ticket data string for QR code
    const ticketData = {
      bookingId: booking._id.toString(),
      ticketId: ticketId,
      movie: booking.movie.title,
      screen: booking.screen.name,
      seats: booking.seats.join(", "),
      date: booking.bookingTime.toISOString(),
      amount: booking.totalAmount,
    };
    
    const qrDataString = JSON.stringify(ticketData);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 200,
      margin: 2,
    });
    
    // Update booking with ticket ID
    booking.ticketId = ticketId;
    await booking.save();
    
    return {
      ticketId,
      qrCode: qrCodeDataURL,
      bookingData: ticketData,
    };
  } catch (error) {
    console.error("Ticket generation failed:", error);
    throw error;
  }
}

export async function getTicketByBookingId(bookingId) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("movie")
      .populate("screen")
      .populate("user", "firstName lastName email");
    
    if (!booking || !booking.ticketId) {
      return null;
    }
    
    const ticketData = {
      bookingId: booking._id.toString(),
      ticketId: booking.ticketId,
      movie: booking.movie.title,
      screen: booking.screen.name,
      seats: booking.seats.join(", "),
      date: booking.bookingTime,
      amount: booking.totalAmount,
    };
    
    const qrDataString = JSON.stringify(ticketData);
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 200,
      margin: 2,
    });
    
    return {
      ticketId: booking.ticketId,
      qrCode: qrCodeDataURL,
      booking: booking,
      bookingData: ticketData,
    };
  } catch (error) {
    console.error("Get ticket failed:", error);
    throw error;
  }
}





