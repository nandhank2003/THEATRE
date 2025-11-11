import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware to protect routes.
 * Checks for a valid Passport.js session OR a valid JWT Bearer token.
 * This allows both session-based (e.g., Google OAuth) and token-based users
 * to access protected routes.
 */
export const protect = async (req, res, next) => {
  // 1. Check for Passport.js session user
  if (req.isAuthenticated()) {
    // req.isAuthenticated() is a Passport.js method.
    // If true, Passport has already populated req.user from the session.
    console.log("DEBUG: protect - User authenticated via session. req.user:", req.user ? { id: req.user.id, email: req.user.email, isAdmin: req.user.isAdmin } : 'not populated');
    if (!req.user) {
      return res.status(401).json({ message: "User session found, but user data is missing." });
    }
    return next();
  }

  // 2. If no session, check for JWT Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret_key"
      );

      console.log("DEBUG: protect - JWT decoded. User ID:", decoded.id);
      const user = await User.findById(decoded.id).select("-password -otp");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach user to the request object for token-based auth
      req.user = user;
      console.log("DEBUG: protect - User authenticated via JWT. req.user:", { id: req.user.id, email: req.user.email, isAdmin: req.user.isAdmin });
      return next();
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res
        .status(401)
        .json({ message: "Not authorized, token invalid or expired" });
    }
  }

  // 3. If neither session nor token is found, deny access
  return res.status(401).json({ message: "Not authorized, no session or token" });
};

export const admin = (req, res, next) => {
  console.log("DEBUG: admin - Checking req.user.isAdmin. Current user:", req.user ? { id: req.user.id, email: req.user.email, isAdmin: req.user.isAdmin } : 'not available');
  if (req.user && req.user.isAdmin) {
    console.log("DEBUG: admin - User IS an admin. Proceeding.");
    next();
  } else {
    console.log("DEBUG: admin - User is NOT an admin. Denying access.");
    res.status(403).json({
      message: "Not authorized as an admin",
      documentation_url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403",
    });
  }
};
