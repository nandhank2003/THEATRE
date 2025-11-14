import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ================================
// 🔐 Protect Middleware (JWT Only)
// ================================
export const protect = async (req, res, next) => {
  let token;

  // Token must come from: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user from DB (password excluded)
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // attach user info to request
      return next();
    } catch (err) {
      console.error("❌ JWT error:", err.message);
      return res.status(401).json({ message: "Token invalid or expired" });
    }
  }

  return res.status(401).json({ message: "Authorization token missing" });
};

// ================================
// 🛡 Admin Middleware
// ================================
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};
