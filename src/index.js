import env from "dotenv";
import events from "events";
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
      console.log(`🚀 Server is listening on port ${PORT} 🎉`);
    });
    app.on("error", (error) =>
      console.log(`❌ Server is not running due to : ${error} ❌`)
    );
  })
  .catch((err) => {
    console.log("ERROR CONNECTION TO DB", err);
  });
