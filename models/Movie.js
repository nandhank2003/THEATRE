import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  language: { type: String },
  duration: { type: String },
  genre: { type: String },
  description: { type: String },
  screen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Screen",
  },
  screenCode: { type: String },
  price: { type: Number },
  showtimes: [String],
  poster: { type: String }, // URL from Cloudinary
  createdAt: { type: Date, default: Date.now },
});

movieSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.model("Movie", movieSchema);
