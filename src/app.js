import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { PARSER_LIMIT } from "./constant.js";

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

export { app };
