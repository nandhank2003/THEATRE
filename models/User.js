import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, required: true },
  password:  { type: String, required: true, minlength: 6 },
  isVerified: { type: Boolean, default: false },
  isAdmin:   { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
