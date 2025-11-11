// 🎬 THEATRE BOOKING SERVER (Render + Local Ready)
// Backend for movie upload, ticket booking, and user management

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import connectDB from "./config/db.js";
import detectPort from "detect-port";
import Screen from "./models/Screen.js";
import configurePassport from "./config/passport.js";
import movieRoutes from "./routes/movieRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import screenRoutes from "./routes/screenRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ===============================
// 🧠 Reliable dotenv loader
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ .env file loaded successfully");
} else {
  console.warn("⚠️ .env file not found, using system environment variables");
}

// Validate env vars
if (!process.env.CLOUDINARY_CLOUD_NAME)
  console.error("❌ Missing CLOUDINARY_CLOUD_NAME in .env");
if (!process.env.MONGO_URI)
  console.error("❌ Missing MONGO_URI in .env");
if (!process.env.JWT_SECRET)
  console.error("❌ Missing JWT_SECRET in .env");
if (!process.env.GOOGLE_CLIENT_ID)
  console.error("❌ Missing GOOGLE_CLIENT_ID in .env");
if (!process.env.GOOGLE_CLIENT_SECRET)
  console.error("❌ Missing GOOGLE_CLIENT_SECRET in .env");

// Debug Info
console.log("🧩 Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "undefined");
console.log("🧩 Mongo URI Loaded:", !!process.env.MONGO_URI);
console.log("🧩 JWT Secret Loaded:", !!process.env.JWT_SECRET);

// ===============================
// ⚙️ Initialize Express
// ===============================
const app = express();

// Configure Passport
configurePassport();

// ===============================
// 🛡️ Helmet Security (Fixed CSP for Local + Cloud)
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        // Allow inline event handlers + external scripts
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrcAttr: ["'unsafe-inline'"],
        // Allow inline styles & Google/CDN fonts
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:"],
        // Allow Cloudinary & Avatars
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com/",
          "https://ui-avatars.com/",
        ],
        // ✅ FIX: Allow localhost & Render API calls
        connectSrc: [
          "'self'",
          "https:",
          "http://localhost:5000",
          "http://127.0.0.1:5000",
          "https://theatre-booking.onrender.com",
        ],
        frameSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// ===============================
// 🪵 Request Logger
// ===============================
app.use(morgan("dev"));

// ===============================
// 🌍 CORS Setup (Universal)
// ===============================
// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "https://malabarcinehub.onrender.com", // Your future production URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===============================
// 🧩 JSON / URL Encoded Middleware
// ===============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// 🔑 Session & Passport Middleware
// ===============================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "a_fallback_secret",
    resave: false,
    saveUninitialized: false,
    // In production, you should use a proper session store like connect-mongo
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ===============================
// 🔗 Connect MongoDB
// ===============================
try {
  await connectDB();
  await Screen.ensureDefaults();
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

// ===============================
// 🔗 API Routes
// ===============================
// All API routes are prefixed with /api
app.use("/api/movies", movieRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// The /auth routes are also part of the API, even if not prefixed with /api
app.use("/auth", authRoutes);

// ===============================
// 📧 OTP Utility Check (Optional Log)
// ===============================
try {
  const { sendOTPEmail } = await import("./utils/sendOTP.js");
  if (sendOTPEmail) console.log("📧 OTP Email utility loaded successfully");
} catch (e) {
  // This is not a critical error, just a warning.
  // console.warn("⚠️ sendOTP.js not found — OTP email may not work until added");
}


// ===============================
// 🌐 Serve Frontend (Public Folder)
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Health Check (Render Friendly)
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Server Running", time: new Date() });
});

// API 404 Not Found Handler (must be after all API routes)
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// ===============================
// 🌐 SPA Fallback (MUST BE LAST)
// ===============================
// This serves the index.html for any non-API GET request, enabling client-side routing.
app.get("*", (req, res) => {
  // Send index.html for any non-API GET request
  res.sendFile(path.join(publicPath, "index.html"));
});

// ===============================
// ❗ Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// ===============================
// 🚀 Start Server
// ===============================
const PREFERRED_PORT = Number.parseInt(process.env.PORT || "5000", 10);

let server;
try {
  const availablePort = await detectPort(PREFERRED_PORT);
  if (availablePort !== PREFERRED_PORT) {
    console.warn(
      `⚠️ Port ${PREFERRED_PORT} is busy. Using available port ${availablePort} instead.`
    );
  }
  process.env.PORT = String(availablePort);
  server = app.listen(availablePort, "0.0.0.0", () => {
    console.log(`🚀 Theatre Booking Server running on port ${availablePort}`);
  });
} catch (err) {
  console.error("❌ Failed to find an available port:", err);
  process.exit(1);
}

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

["SIGINT", "SIGTERM", "SIGBREAK", "SIGUSR2"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
