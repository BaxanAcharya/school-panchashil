import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { API_PREFIX, PARSER_LIMIT } from "./constant.js";
import adminRouter from "./routes/admin.route.js";
import classRouter from "./routes/class.router.js";

const app = express();
app.use(
  express.json({
    limit: PARSER_LIMIT,
  })
);
//extended is set to true because we want to be able to parse nested objects
app.use(express.urlencoded({ extended: true, limit: PARSER_LIMIT }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.static("public"));

app.use(cookieParser());

app.use(`${API_PREFIX}/admin`, adminRouter);
app.use(`${API_PREFIX}/class`, classRouter);

export { app };
