import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String },
  password:  { type: String, minlength: 6 }, // Not required for Google OAuth users
  googleId:  { type: String },
  isAdmin:   { type: Boolean, required: true, default: false },
  isVerified:{ type: Boolean, default: false },
  otp:       { type: String },
  otpExpires:{ type: Date },
  joinedAt:  { type: Date, default: Date.now },
});

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

async function hashPasswordOnUpdate(next) {
  const update = this.getUpdate();
  if (!update) return next();

  const candidate =
    update.password ||
    (update.$set && update.$set.password) ||
    (update.$setOnInsert && update.$setOnInsert.password);

  if (!candidate) return next();

  const cleanPassword = candidate.normalize("NFC").trim();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);

  if (update.password) update.password = hashedPassword;
  if (update.$set && update.$set.password) update.$set.password = hashedPassword;
  if (update.$setOnInsert && update.$setOnInsert.password)
    update.$setOnInsert.password = hashedPassword;

  next();
}

userSchema.pre("findOneAndUpdate", hashPasswordOnUpdate);
userSchema.pre("updateOne", hashPasswordOnUpdate);
userSchema.pre("updateMany", hashPasswordOnUpdate);
userSchema.pre("replaceOne", hashPasswordOnUpdate);

// ✅ Compare passwords for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
