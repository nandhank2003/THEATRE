import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  bookingId:  { type: String, required: true, unique: true }, // human readable
  ticketId:   { type: String, required: true, unique: true },
  qrCode:     { type: String, required: true }, // Data URL (base64) or Cloudinary URL
  used:       { type: Boolean, default: false },

  movieTitle: { type: String, required: true },
  screenName: { type: String, required: true },
  seats:      [{ type: String, required: true }],
  showTime:   { type: Date, required: true },
  email:      { type: String, required: true },

  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
