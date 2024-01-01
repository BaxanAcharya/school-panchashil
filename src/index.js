import env from "dotenv";
import express from "express";
import connectDB from "./db/index.js";

env.config({
  path: "./env",
});

const app = express();

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
