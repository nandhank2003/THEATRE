import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  movieName: String,
  screen: String,
  seatNumbers: String,
  showtime: String,
  user: String,
  paymentStatus: { type: String, default: "pending" },
  bookingDate: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
