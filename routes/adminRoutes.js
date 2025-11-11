import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

const router = express.Router();

// All routes in this file are protected and for admins only
router.use(protect, admin);

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments();

    const totalBookings = await Booking.countDocuments({ status: "confirmed" });
    const todayBookings = await Booking.countDocuments({
      status: "confirmed",
      bookingTime: { $gte: today },
    });

    const revenueResult = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      totalUsers,
      totalMovies,
      totalBookings,
      todayBookings,
      totalRevenue: revenueResult[0]?.total || 0,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
});

/**
 * @desc    Get all bookings for the admin panel
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .sort({ bookingTime: -1 })
      .limit(200); // Limit to recent 200 to avoid performance issues
    res.json(bookings);
  } catch (error) {
    console.error("Failed to fetch all bookings for admin:", error);
    res.status(500).json({ message: "Server error fetching bookings" });
  }
});

/**
 * @desc    Get all users for the admin panel
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password -otp").sort({ joinedAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Failed to fetch all users for admin:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

export default router;