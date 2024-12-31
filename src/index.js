import env from "dotenv";
import events from "events";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { app } from "./app.js";
import connectDB from "./db/index.js";
events.EventEmitter.defaultMaxListeners = 15;
env.config({
  path: "./env",
});

// Create a writable stream (in append mode)
const logStream = fs.createWriteStream(
  path.join(path.resolve(), "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: logStream }));
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is now live !! 🎉`);
    });
    app.on("error", (error) =>
      console.log(`❌ Server is not running due to : ${error} ❌`)
    );
  })
  .catch((err) => {
    console.log("ERROR CONNECTION TO DB", err);
  });
