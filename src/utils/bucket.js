import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bucket = cloudinary;
const uplaodOnBucket = async (filePath) => {
  try {
    if (!filePath) return null;
    const fileRepose = await bucket.uploader.upload(filePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(filePath);
    return fileRepose.secure_url;
  } catch (error) {
    console.log("error", error);
    fs.unlinkSync(filePath);
    return null;
  }
};

export { uplaodOnBucket };
