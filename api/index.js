import env from "dotenv";
import { app } from "../src/app.js";
import connectDB from "../src/db/index.js";
env.config({
  path: "./env",
});

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
