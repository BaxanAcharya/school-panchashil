import env from "dotenv";
import events from "events";
import { hostname } from "os";
import { app } from "./app.js";
import connectDB from "./db/index.js";
events.EventEmitter.defaultMaxListeners = 15;

env.config({
  path: "./env",
});

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log("test");
      console.log(`🚀 Server is listening at host ${hostname}:${PORT} 🎉`);
    });
    app.on("error", (error) =>
      console.log(`❌ Server is not running due to : ${error} ❌`)
    );
  })
  .catch((err) => {
    console.log("ERROR CONNECTION TO DB", err);
  });
