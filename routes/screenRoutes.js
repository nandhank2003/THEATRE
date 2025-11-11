import express from "express";
import Screen from "../models/Screen.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const screens = await Screen.find().sort({ name: 1 });
    res.json(screens);
  } catch (error) {
    console.error("Failed to fetch screens:", error);
    res.status(500).json({ message: "Failed to fetch screens" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const screen = await Screen.findOne({ code: req.params.code.toLowerCase() });
    if (!screen) {
      return res.status(404).json({ message: "Screen not found" });
    }
    res.json(screen);
  } catch (error) {
    console.error("Failed to fetch screen:", error);
    res.status(500).json({ message: "Failed to fetch screen details" });
  }
});

export default router;

