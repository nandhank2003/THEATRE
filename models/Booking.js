import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    seats: {
      type: [
        {
          type: String,
          uppercase: true,
          trim: true,
        },
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one seat must be selected.",
      },
    },
    totalAmount: { type: Number, min: 0, required: true },
    bookingTime: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "failed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentReference: { type: String },
    paymentMethod: { 
      type: String, 
      enum: ["razorpay", "cash", "other"],
      default: "razorpay"
    },
    ticketId: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index(
  { movie: 1, "seats": 1 },
  { unique: false, background: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

