import express from "express";
import Movie from "../models/Movie.js";
import Screen from "../models/Screen.js";
import BookingSeat from "../models/BookingSeat.js";

const router = express.Router();

// ✅ Get all movies with screen details
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find()
      .populate("screen")
      .sort({ createdAt: -1 });

    const formatted = movies.map((movie) => ({
      ...movie.toJSON(),
      screen: movie.screen?.name || movie.screen || "",
      screenCode: movie.screenCode || movie.screen?.code || "",
      screenId: movie.screen?._id || null,
      seatCapacity: movie.screen?.totalSeats || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching movies:", err);
    res.status(500).json({ message: "Failed to fetch movies" });
  }
});

// ✅ Get seat layout & booked seats for a movie
router.get("/:id/seats", async (req, res) => {
  try {
    // First get the movie without populating to check raw screen value
    const movieRaw = await Movie.findById(req.params.id);
    if (!movieRaw) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Now populate to get the screen object if it exists
    const movie = await Movie.findById(req.params.id).populate("screen");
    let screen = movie.screen;
    
    // If screen is populated but null/undefined, or if it's an ObjectId that doesn't exist
    if (!screen || (screen && !screen._id)) {
      // Try to find by screenCode first
      if (movie.screenCode) {
        screen = await Screen.findOne({ code: movie.screenCode });
        if (screen) {
          movie.screen = screen._id;
          await movie.save();
        }
      }
      
      // If still no screen, check if screenCode has a number we can use
      if (!screen && movie.screenCode) {
        const screenNumber = movie.screenCode.toString().match(/\d+/)?.[0];
        if (screenNumber) {
          screen = await Screen.findOne({ code: `screen${screenNumber}` });
          if (screen) {
            movie.screen = screen._id;
            movie.screenCode = screen.code;
            await movie.save();
          }
        }
      }
      
      // Check if the raw screen field is a string number (old format)
      if (!screen && movieRaw.screen && typeof movieRaw.screen === 'string' && /^\d+$/.test(movieRaw.screen)) {
        screen = await Screen.findOne({ code: `screen${movieRaw.screen}` });
        if (screen) {
          movie.screen = screen._id;
          movie.screenCode = screen.code;
          await movie.save();
        }
      }
    }
    
    if (!screen) {
      console.error(`Movie ${movie._id} has no screen configured. screenCode: ${movie.screenCode}, raw screen: ${movieRaw.screen}`);
      return res.status(400).json({ 
        message: "Screen not configured for this movie. Please contact admin to assign a screen." 
      });
    }
    
    // Reload screen to ensure we have the latest data
    screen = await Screen.findById(screen._id || screen);
    if (!screen) {
      return res.status(400).json({ 
        message: "Screen not found in database. Please contact admin." 
      });
    }
    
    // If screen exists but has no seatMap, generate it
    if (!screen.seatMap || screen.seatMap.length === 0) {
      const { generateSeatLayout, SCREEN_BLUEPRINTS } = await import("../utils/seatLayout.js");
      const blueprint = SCREEN_BLUEPRINTS.find(bp => bp.code === screen.code);
      if (blueprint) {
        screen.seatMap = generateSeatLayout({
          rows: screen.rows || blueprint.rows,
          columns: screen.columns || blueprint.columns,
          premiumRows: blueprint.premiumRows || [],
        });
        await screen.save();
      } else {
        return res.status(400).json({ 
          message: "Screen seat layout not configured. Please contact admin." 
        });
      }
    }

    const bookedSeats = await BookingSeat.find({
      movie: movie._id,
      screen: screen._id,
    }).select("seatId -_id");

    res.json({
      movie: {
        id: movie.id,
        title: movie.title,
        price: movie.price,
        screen: {
          id: screen.id,
          name: screen.name,
          code: screen.code,
          totalSeats: screen.totalSeats,
          rows: screen.rows,
          columns: screen.columns,
        },
      },
      seatMap: screen.seatMap,
      bookedSeatIds: bookedSeats.map((seat) => seat.seatId),
    });
  } catch (err) {
    console.error("Seat map fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch seat layout" });
  }
});

// ✅ Add a new movie (Admin)
router.post("/", async (req, res) => {
  try {
    const { screenCode, ...rest } = req.body;
    if (!screenCode) {
      return res
        .status(400)
        .json({ message: "Screen selection is required for a movie" });
    }

    const screen = await Screen.findOne({ code: screenCode });
    if (!screen) {
      return res
        .status(404)
        .json({ message: `Screen with code ${screenCode} not found` });
    }

    const movie = new Movie({
      ...rest,
      screen: screen._id,
      screenCode,
    });
    await movie.save();
    const populatedMovie = await movie.populate("screen");
    res.status(201).json({
      ...populatedMovie.toJSON(),
      screen: populatedMovie.screen?.name,
      screenId: populatedMovie.screen?._id,
    });
  } catch (err) {
    res.status(400).json({ message: "Error adding movie", error: err.message });
  }
});

// ✅ Delete movie by ID
router.delete("/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete movie" });
  }
});

export default router;
