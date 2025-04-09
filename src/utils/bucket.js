import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import multer from "multer";
import path from "path";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bucket = cloudinary;
// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

const uplaodOnBucket = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.uploader.upload_stream(
      { resource_type: "raw" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const uplaodLogFileOnBucket = async () => {
  try {
    const logPath = path.join(path.resolve(), "access.log");
    if (!fs.existsSync(logPath)) {
      console.log("Access log not found");
      return;
    }

    const customFileName = `access-log`;
    const fileRepose = await bucket.uploader.upload(logPath, {
      public_id: `logs/${customFileName}`, // Set the custom name
      resource_type: "auto",
    });
    return fileRepose.secure_url;
  } catch (error) {
    return null;
  }
};

export { uplaodLogFileOnBucket, uplaodOnBucket };
