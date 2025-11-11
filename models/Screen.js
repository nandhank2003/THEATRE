import mongoose from "mongoose";
import {
  SCREEN_BLUEPRINTS,
  generateSeatLayout,
} from "../utils/seatLayout.js";

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true },
    row: { type: String, required: true },
    column: { type: Number, required: true },
    seatType: { 
      type: String, 
      enum: ["standard", "preferred", "value", "premium", "wheelchair"],
      default: "standard"
    },
    isPremium: { type: Boolean, default: false },
    isWheelchair: { type: Boolean, default: false },
    priceModifier: { type: Number, default: 0 },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    seatMap: { type: [seatSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

screenSchema.statics.ensureDefaults = async function ensureDefaults() {
  const count = await this.countDocuments();
  if (count >= SCREEN_BLUEPRINTS.length) {
    return;
  }

  const existingCodes = new Set(
    (
      await this.find({}, { code: 1 })
    ).map((screen) => screen.code)
  );

  const screensToInsert = SCREEN_BLUEPRINTS.filter(
    (blueprint) => !existingCodes.has(blueprint.code)
  ).map((blueprint) => ({
    ...blueprint,
    seatMap: generateSeatLayout({
      rows: blueprint.rows,
      columns: blueprint.columns,
      premiumRows: blueprint.premiumRows || [],
      preferredRows: blueprint.preferredRows || [],
      valueRows: blueprint.valueRows || [],
      wheelchairSeats: blueprint.wheelchairSeats || [],
    }),
  }));

  if (screensToInsert.length > 0) {
    await this.insertMany(screensToInsert);
    console.log(
      `✅ Seeded default screens: ${screensToInsert
        .map((screen) => screen.name)
        .join(", ")}`
    );
  }
};

const Screen = mongoose.model("Screen", screenSchema);

export default Screen;

