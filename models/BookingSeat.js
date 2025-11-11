import mongoose from "mongoose";

const bookingSeatSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: true,
    },
    seatId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    status: {
      type: String,
      enum: ["booked"],
      default: "booked",
    },
  },
  { timestamps: true }
);

bookingSeatSchema.index({ movie: 1, seatId: 1 }, { unique: true });

const BookingSeat = mongoose.model("BookingSeat", bookingSeatSchema);

export default BookingSeat;

