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
    bucket.uploader.upload(
      filePath,
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return null;
        return result;
      }
    );
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};

export { uplaodOnBucket };
