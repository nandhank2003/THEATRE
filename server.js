// 🎬 THEATRE BOOKING SERVER (Cyclic + Netlify + Gmail SMTP + Mongo Sessions)
// ESM-ready. Works locally and on Cyclic.

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
// 3) Path setup
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// 4) Validate ENV
// ------------------------------
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASS"];
for (const k of requiredEnv) {
  if (!process.env[k]) console.error(`❌ Missing ${k} in .env`);
}
console.log("🧩 Mongo URI Loaded:", !!process.env.MONGO_URI);
console.log("🧩 JWT Secret Loaded:", !!process.env.JWT_SECRET);
console.log("📧 Gmail SMTP Loaded:", !!process.env.EMAIL_USER);

// ------------------------------
// 5) Initialize App
// ------------------------------
const app = express();
app.set("trust proxy", 1);

// ------------------------------
// 6) 🌐 CORS (Allow Netlify + Cyclic + Local)
// ------------------------------
const allowedOrigins = [
  "https://chipper-duckanoo-225d10.netlify.app", // ✅ Netlify frontend
  "https://your-app-name.cyclic.app",            // ✅ Cyclic backend
  "http://localhost:5173",                       // local dev
  "http://localhost:3000",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      console.log(`🚫 CORS Blocked: ${origin}`);
      return cb(new Error(`CORS not allowed for ${origin}`), false);
    },
    credentials: true,
  })
);
app.options("*", cors());

// ------------------------------
// 7) 🛡️ Helmet Security (CSP relaxed for Netlify + Cyclic)
// ------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://ui-avatars.com",
        ],
        connectSrc: [
          "'self'",
          "https://chipper-duckanoo-225d10.netlify.app",
          "https://your-app-name.cyclic.app",
          "http://localhost:5173",
          "http://localhost:5000",
        ],
        frameSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// ------------------------------
// 8) Logging, Compression, Parsers
// ------------------------------
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// 9) Sessions (Mongo)
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
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
    },
    proxy: true,
  })
);

// ------------------------------
// 10) Passport Config
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
// 11) MongoDB Connection
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
// 12) API Routes
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
// 13) Static Files / SPA
// ------------------------------
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Server Running", time: new Date().toISOString() });
});

// ------------------------------
// 14) Gmail SMTP Health Check
// ------------------------------
app.get("/api/health/email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 20000,
    });

    await transporter.verify();
    res.json({
      ok: true,
      provider: "gmail",
      host: "smtp.gmail.com",
    });
  } catch (e) {
    console.error("❌ Gmail SMTP Error:", e.message);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ------------------------------
// 15) Debug & Fallback APIs
// ------------------------------
app.get("/api/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI_LOADED: !!process.env.MONGO_URI,
    JWT_SECRET_LOADED: !!process.env.JWT_SECRET,
    SESSION_SECRET_LOADED: !!process.env.SESSION_SECRET,
    EMAIL_USER_LOADED: !!process.env.EMAIL_USER,
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ------------------------------
// 16) Global Error Handler
// ------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// ------------------------------
// 17) Start Server
// ------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Theatre Booking Server running on port ${PORT}`);
});
