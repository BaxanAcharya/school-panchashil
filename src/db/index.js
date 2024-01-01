import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const dbConnection = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`,
      {}
    );
    console.log("Connected to database", dbConnection.connection.host);
  } catch (error) {
    console.log("Error while connection to db", error);
    process.exit(1);
  }
};

export default connectDB;
