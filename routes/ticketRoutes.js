import express from "express";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// ✅ Get all tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ bookingDate: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// ✅ Add a ticket (after user booking)
router.post("/", async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: "Error adding ticket" });
  }
});

export default router;
