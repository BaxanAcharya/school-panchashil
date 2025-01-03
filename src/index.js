import env from "dotenv";
import events from "events";
import { app } from "./app.js";
import connectDB from "./db/index.js";
import { uplaodLogFileOnBucket } from "./utils/bucket.js";
events.EventEmitter.defaultMaxListeners = 15;
env.config({
  path: "./env",
});

connectDB()
  .then(() => {
    const env = process.env.ENV;
    if(!env){
      setInterval(async () => {
          const res = await uplaodLogFileOnBucket();
          if (res) {
            console.log("Log file uploaded on bucket");
          } else {
            console.log("Log file not uploaded on bucket");
          }

      }, 5000);
    }
    
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
