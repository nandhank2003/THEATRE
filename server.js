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
import MongoStore from "connect-mongo";
import passport from "passport";
import connectDB from "./config/db.js";
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
if (!process.env.MONGO_URI) console.error("❌ Missing MONGO_URI in .env");
if (!process.env.JWT_SECRET) console.error("❌ Missing JWT_SECRET in .env");

// Debug Info
console.log("🧩 Mongo URI Loaded:", !!process.env.MONGO_URI);
console.log("🧩 JWT Secret Loaded:", !!process.env.JWT_SECRET);

// ===============================
// ⚙️ Initialize Express
// ===============================
const app = express();
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
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrcAttr: ["'unsafe-inline'"], // ✅ allows inline event handlers
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com/",
          "https://ui-avatars.com/",
        ],
        connectSrc: [
          "'self'",
          "https:",
          "http://localhost:5000",
          "https://malabarcinehub.onrender.com",
          "https://theatre.onrender.com",
          "https://theatre-1-err2.onrender.com", // ✅ Added your live Render domain
        ],
        frameSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// ===============================
// 🪵 Logger & CORS
// ===============================
app.use(morgan("dev"));

// ✅ Allow Local + Render Frontend
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "https://malabarcinehub.onrender.com",
  "https://theatre.onrender.com",
  "https://theatre-1-err2.onrender.com", // ✅ added your deployed frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error(`🚫 Blocked by CORS: ${origin} not allowed.`),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ===============================
// 🧩 Parsers, Sessions, Passport
// ===============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "backup_secret",
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something stored
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions", // Collection to store sessions
            ttl: 14 * 24 * 60 * 60, // Session TTL = 14 days
            autoRemove: "native", // Let MongoDB handle expired session cleanup
        }),
        cookie: {
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            httpOnly: true,
        },
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
  console.log("✅ MongoDB Connected Successfully");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

// ===============================
// 🔗 API Routes
// ===============================
app.use("/api/movies", movieRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/auth", authRoutes);

// ===============================
// 🌐 Static + SPA Handling
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Health check for Render
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Server Running", time: new Date() });
});

// 404 for API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve frontend (for HTML/SPA)
app.get("*", (req, res) => {
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
// 🚀 Start Server (Render Compatible)
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Theatre Booking Server running on port ${PORT}`);
});
