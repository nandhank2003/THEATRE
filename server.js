// 🎬 THEATRE BOOKING SERVER (Render + Brevo + Mongo Sessions)
// ESM-ready. Works locally and on Render.

// ------------------------------
// 1) Load ENV first
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
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import nodemailer from "nodemailer";

import connectDB from "./config/db.js";
import Screen from "./models/Screen.js";
import configurePassport from "./config/passport.js";

// Routes
import movieRoutes from "./routes/movieRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import screenRoutes from "./routes/screenRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ------------------------------
// 3) Path helpers
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// 4) Validate critical ENV
// ------------------------------
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
for (const k of requiredEnv) {
  if (!process.env[k]) console.error(`❌ Missing ${k} in .env`);
}
console.log("🧩 Mongo URI Loaded:", !!process.env.MONGO_URI);
console.log("🧩 JWT Secret Loaded:", !!process.env.JWT_SECRET);

// ------------------------------
// 5) App init
// ------------------------------
const app = express();
app.set("trust proxy", 1);

// ------------------------------
// 6) Basic Middlewares (Simplified CORS for same-origin deployment)
// ------------------------------
app.use(
  cors({
    origin: true, // Automatically allows same-origin
    credentials: true, // Enables cookies/sessions
  })
);
app.options("*", cors());

app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// 7) Helmet Security
// ------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://ui-avatars.com",
        ],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// ------------------------------
// 8) Sessions (Mongo-backed)
// ------------------------------
const isProd = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: process.env.SESSION_SECRET || "backup_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,
      secure: isProd, // HTTPS only in production
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
    },
    proxy: true,
  })
);

// ------------------------------
// 9) Passport Config
// ------------------------------
try {
  configurePassport(passport);
} catch {
  try {
    configurePassport();
  } catch {}
}
app.use(passport.initialize());
app.use(passport.session());

// ------------------------------
// 10) Connect MongoDB
// ------------------------------
try {
  await connectDB();
  if (typeof Screen?.ensureDefaults === "function") {
    await Screen.ensureDefaults();
  }
  console.log("✅ MongoDB Connected Successfully");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

// ------------------------------
// 11) API Routes
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
// 12) Static / SPA
// ------------------------------
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Server Running", time: new Date().toISOString() });
});

// ------------------------------
// 13) Brevo SMTP Verify Endpoint (Optional)
// ------------------------------
app.get("/api/health/email", async (req, res) => {
  try {
    if (!process.env.BREVO_HOST) {
      return res
        .status(400)
        .json({ ok: false, message: "BREVO_* env not set" });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port: Number(process.env.BREVO_PORT || 587),
      secure: false,
      auth: { user: process.env.BREVO_USER, pass: process.env.BREVO_PASS },
    });
    await transporter.verify();
    res.json({ ok: true, provider: "brevo", host: process.env.BREVO_HOST });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ------------------------------
// 14) Debug & Fallback Routes
// ------------------------------
app.get("/api/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI_LOADED: !!process.env.MONGO_URI,
    JWT_SECRET_LOADED: !!process.env.JWT_SECRET,
    SESSION_SECRET_LOADED: !!process.env.SESSION_SECRET,
    BREVO_HOST_LOADED: !!process.env.BREVO_HOST,
    BREVO_USER_LOADED: !!process.env.BREVO_USER,
  });
});

// 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Fallback to SPA index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ------------------------------
// 15) Global Error Handler
// ------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// ------------------------------
// 16) Start Server
// ------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Theatre Booking Server running on port ${PORT}`);
});
