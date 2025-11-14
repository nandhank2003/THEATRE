// /config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false); // optional, prevents warnings

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000, // 20 seconds to find cluster
      socketTimeoutMS: 45000,          // stable connection
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // helpful Render hint
    if (error.message.includes("ENODATA") || error.message.includes("ENOTFOUND")) {
      console.error("⚠️ DNS issue — check MONGO_URI or network on Render");
    }

    process.exit(1);
  }
};

export default connectDB;
