import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { API_PREFIX, PARSER_LIMIT } from "./constant.js";
import adminRouter from "./routes/admin.route.js";
import classRouter from "./routes/class.router.js";
import examRouter from "./routes/exam.router.js";
import feeRouter from "./routes/fee.router.js";
import resultRouter from "./routes/result.router.js";
import studentRouter from "./routes/student.router.js";
import subjectRouter from "./routes/subject.router.js";
import transportationAreaRouter from "./routes/transportationArea.router.js";
import transportationFeeRouter from "./routes/transportationFee.router.js";

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
app.use(`${API_PREFIX}/student`, studentRouter);
app.use(`${API_PREFIX}/subject`, subjectRouter);
app.use(`${API_PREFIX}/fee`, feeRouter);
app.use(`${API_PREFIX}/exam`, examRouter);
app.use(`${API_PREFIX}/result`, resultRouter);
app.use(`${API_PREFIX}/transportationArea`, transportationAreaRouter);
app.use(`${API_PREFIX}/transportationFee`, transportationFeeRouter);
export { app };
