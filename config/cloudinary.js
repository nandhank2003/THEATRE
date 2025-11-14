// /config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

// Server.js already loaded dotenv, so no need here

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME);

export default cloudinary;
