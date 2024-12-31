import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
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
    fs.unlinkSync(filePath);
    return null;
  }
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
