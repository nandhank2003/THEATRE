import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/poster", upload.single("poster"), async (req, res) => {
  try {
    console.log("📸 File received:", req.file?.path);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "theatre_posters",
      resource_type: "image",
    });

    fs.unlinkSync(req.file.path);
    console.log("✅ Cloudinary Upload URL:", result.secure_url);
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ message: "Poster upload failed", error: err.message });
  }
});

export default router;
