// 🎬 MALABAR CINEHUB — THEATRE BOOKING SERVER
// Clean | Modern | Render-ready | No Gmail | No Passport | No Sessions
// MongoDB + Cloudinary + Resend + Razorpay + JWT + QR Tickets

// ------------------------------
// 1) Load ENV
// ------------------------------
import dotenv from "dotenv";
dotenv.config();

// ------------------------------
// 2) Imports
// ------------------------------
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoose from "mongoose";

import connectDB from "./config/db.js";

// ROUTES
import movieRoutes from "./routes/movieRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import screenRoutes from "./routes/screenRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ------------------------------
// 3) Path Setup
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// 4) Validate ENV
// ------------------------------
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

for (const key of requiredEnv) {
  if (!process.env[key]) console.error(`❌ Missing ENV: ${key}`);
}

// ------------------------------
// 5) Initialize App
// ------------------------------
const app = express();
app.set("trust proxy", 1);

// ------------------------------
// 6) CORS
// ------------------------------
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ------------------------------
// 7) Helmet Security (FIXED FOR RAZORPAY)
// ------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],

        // Allow Razorpay popup
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com",
        ],

        "script-src-attr": ["'unsafe-inline'"],

        "frame-src": [
          "'self'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com"
        ],

        "child-src": [
          "'self'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com"
        ],

        "connect-src": [
          "'self'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com"
        ],

        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com"
        ],
      },
    },
  })
);

// ------------------------------
// 8) Logging, Compression, Parsers
// ------------------------------
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// 9) MongoDB Connection
// ------------------------------
try {
  await connectDB();
  console.log("✅ MongoDB Connected Successfully");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

// ------------------------------
// 10) API Routes
// ------------------------------
app.use("/api/movies", movieRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/auth", authRoutes);

// ------------------------------
// 11) Public Folder
// ------------------------------
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ------------------------------
// 12) Health Route
// ------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    mongodb: !!process.env.MONGO_URI,
  });
});

// ------------------------------
// 13) Unknown API Handler
// ------------------------------
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ------------------------------
// 14) SPA Fallback (Frontend build support)
// ------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ------------------------------
// 15) Global Error Handler
// ------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ------------------------------
// 16) Start Server
// ------------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error("🔥 Server startup error:", err);
    process.exit(1);
  }
});

// ------------------------------
// 17) Graceful Shutdown
// ------------------------------
const gracefulShutdown = (signal) => {
  if (process.env.shutdown) return;
  process.env.shutdown = true;

  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error("❌ Could not close connections in time, forcing shutdown");
    process.exit(1);
  }, 10000);

  server.close(() => {
    console.log("✅ HTTP server closed.");
    mongoose.connection.close(false).then(() => {
      console.log("🔒 MongoDB connection closed.");
      clearTimeout(timeout);
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGUSR2", () => {
  gracefulShutdown("SIGUSR2");
});
