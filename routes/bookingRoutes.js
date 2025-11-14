import express from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import BookingSeat from "../models/BookingSeat.js";
import Movie from "../models/Movie.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { generateTicket, getTicketByBookingId } from "../utils/ticketGenerator.js";
import { sendTicketEmail } from "../utils/sendTicketEmail.js";

// Initialize Razorpay
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_Re7Ks1Il3ik9Ci";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "7Hfjeor4UI0GJD8Bn0HXcZnj";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

console.log("Razorpay initialized with key_id:", RAZORPAY_KEY_ID.substring(0, 10) + "...");

const router = express.Router();

// ===============================
// 1️⃣ Create Booking (reserve seats - before payment)
// ===============================
router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { movieId, seats, totalAmount } = req.body;

    if (!movieId || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "movieId and seats are required to create a booking" });
    }

    const normalizedSeats = seats.map((seat) => seat.toUpperCase());

    const movie = await Movie.findById(movieId)
      .populate("screen")
      .session(session);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const screen = movie.screen;
    if (!screen) {
      return res
        .status(400)
        .json({ message: "Movie is not associated with a screen" });
    }

    const seatMapIds = new Set(screen.seatMap.map((seat) => seat.seatId));
    const invalidSeats = normalizedSeats.filter(
      (seat) => !seatMapIds.has(seat)
    );
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        message: "Invalid seat selection",
        invalidSeats,
      });
    }

    const booking = new Booking({
      user: req.user._id,
      movie: movie._id,
      screen: screen._id,
      seats: normalizedSeats,
      totalAmount: totalAmount ?? movie.price * normalizedSeats.length,
      status: "pending", // confirmed after payment
      paymentStatus: "pending",
    });

    await booking.save({ session });

    const seatReservations = normalizedSeats.map((seatId) => ({
      movie: movie._id,
      screen: screen._id,
      seatId,
      booking: booking._id,
    }));

    await BookingSeat.insertMany(seatReservations, {
      session,
      ordered: true,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("movie")
      .populate("screen")
      .populate("user", "name email phone");

    res.status(201).json({
      message: "Seats reserved. Please complete payment to confirm booking.",
      booking: populatedBooking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      return res.status(409).json({
        message: "One or more seats have already been booked",
        conflictSeat:
          error.keyValue?.seatId || error.keyPattern?.seatId?.[0] || null,
      });
    }

    console.error("Booking creation failed:", error);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// ===============================
// 2️⃣ Get all bookings for logged-in user (with tickets)
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie")
      .populate("screen")
      .sort({ bookingTime: -1 });

    const bookingsWithTickets = await Promise.all(
      bookings.map(async (booking) => {
        if (booking.status === "confirmed") {
          try {
            const ticket = await getTicketByBookingId(booking._id);
            if (ticket) {
              return {
                ...booking.toJSON(),
                ticket: {
                  ticketId: ticket.ticketId,
                  qrCode: ticket.qrCode,
                  used: ticket.used,
                },
              };
            }
          } catch (error) {
            console.error("Error getting ticket for booking:", error);
          }
        }
        return booking.toJSON();
      })
    );

    res.json(bookingsWithTickets);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ===============================
// 3️⃣ Get single ticket by booking ID
// ===============================
router.get("/:id/ticket", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "confirmed",
    });

    if (!booking) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const ticket = await getTicketByBookingId(booking._id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not generated" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    res.status(500).json({ message: "Failed to fetch ticket" });
  }
});

// ===============================
// 4️⃣ Cancel booking (release seats)
// ===============================
router.delete("/:id", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Booking not found" });
    }

    await BookingSeat.deleteMany(
      { booking: booking._id },
      { session }
    );

    await booking.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to cancel booking:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ===============================
// 5️⃣ Create Razorpay payment order
// ===============================
router.post("/:id/create-payment", protect, async (req, res) => {
  try {
    console.log("Creating payment order for booking:", req.params.id);
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "pending",
    }).populate("movie");

    if (!booking) {
      console.log("Booking not found or already processed");
      return res.status(404).json({ message: "Booking not found or already processed" });
    }

    if (!booking.movie) {
      console.log("Movie not found for booking");
      return res.status(400).json({ message: "Movie not found for this booking" });
    }

    if (!booking.totalAmount || booking.totalAmount <= 0) {
      console.log("Invalid booking amount:", booking.totalAmount);
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const amountInPaise = Math.round(booking.totalAmount * 100);
    if (amountInPaise < 100) {
      console.log("Amount too small for Razorpay:", amountInPaise);
      return res.status(400).json({ message: "Minimum amount is ₹1" });
    }
    if (amountInPaise > 100000000) {
      console.log("Amount too large for Razorpay:", amountInPaise);
      return res.status(400).json({ message: "Maximum amount is ₹10,00,000" });
    }

    if (isNaN(amountInPaise) || !isFinite(amountInPaise)) {
      console.log("Invalid amount:", booking.totalAmount, "->", amountInPaise);
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const receiptId = `B${booking._id.toString().slice(-8)}${Date.now().toString().slice(-6)}`;
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId.substring(0, 40),
      notes: {
        bookingId: booking._id.toString(),
        movieId: booking.movie._id?.toString() || booking.movie.toString(),
        userId: req.user._id.toString(),
      },
    };

    console.log("Razorpay order options:", { ...options, notes: options.notes });

    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log("Razorpay order created successfully:", order.id);
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      console.error("Razorpay error details:", {
        message: razorpayError.message,
        statusCode: razorpayError.statusCode,
        error: razorpayError.error,
        response: razorpayError.response?.data
      });
      
      if (razorpayError.statusCode) {
        return res.status(razorpayError.statusCode).json({
          message: "Razorpay payment order creation failed",
          error: razorpayError.error?.description || razorpayError.message,
          details: razorpayError.error
        });
      }
      throw razorpayError;
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment order creation failed - Full error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to create payment order", 
      error: error.message || "Unknown error",
      details: error.response?.data || error.error || "Check server logs for details"
    });
  }
});

// ===============================
// 6️⃣ Verify Razorpay payment + confirm booking + generate ticket + send email
// ===============================
router.post("/:id/verify-payment", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "pending",
    })
      .populate("movie")
      .populate("screen")
      .populate("user", "name email phone")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Booking not found or already processed" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "7Hfjeor4UI0GJD8Bn0HXcZnj";
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    booking.status = "confirmed";
    booking.paymentStatus = "completed";
    booking.paymentReference = razorpay_payment_id;
    booking.paymentMethod = "razorpay";
    await booking.save({ session });

    // ✅ Generate ticket (QR based)
    const ticketData = await generateTicket(booking);

    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("movie")
      .populate("screen")
      .populate("user", "name email phone");

    // ✅ Send ticket email (non-blocking)
    if (populatedBooking.user && populatedBooking.user.email) {
      sendTicketEmail(populatedBooking.user, populatedBooking, ticketData)
        .then((ok) => {
          if (ok) console.log(`✅ Ticket email sent to ${populatedBooking.user.email}`);
          else console.log(`⚠️ Ticket email failed for ${populatedBooking.user.email}`);
        })
        .catch((err) => console.error("Ticket email error:", err));
    }

    res.json({
      message: "Payment verified and booking confirmed",
      booking: populatedBooking,
      ticket: ticketData,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Payment verification failed:", error);
    res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
});

// ===============================
// 7️⃣ Admin stats
// ===============================
router.get("/admin/stats", protect, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBookings = await Booking.countDocuments({
      status: "confirmed",
      bookingTime: { $gte: today },
    });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "confirmed", paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    
    const totalBookings = await Booking.countDocuments({ status: "confirmed" });
    
    res.json({
      todayBookings,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error("Failed to fetch booking stats:", error);
    res.status(500).json({ message: "Failed to fetch booking stats" });
  }
});

// ===============================
// 8️⃣ Admin - all bookings
// ===============================
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("movie", "title posterUrl")
      .populate("screen", "name")
      .populate("user", "name email phone")
      .sort({ bookingTime: -1 })
      .limit(100);
    
    res.json(bookings);
  } catch (error) {
    console.error("Failed to fetch all bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ===============================
// 9️⃣ Admin - single booking
// ===============================
router.get("/admin/:id", protect, admin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("screen")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error(`Failed to fetch booking ${req.params.id}:`, error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }
    res.status(500).json({ message: "Failed to fetch booking details" });
  }
});

export default router;
