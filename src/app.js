import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { API_PREFIX, PARSER_LIMIT } from "./constant.js";
import adminRouter from "./routes/admin.route.js";
import admminControlRouter from "./routes/adminControl.route.js";
import billRouter from "./routes/bill.route.js";
import billFeeRouter from "./routes/billFee.route.js";
import classRouter from "./routes/class.route.js";
import examRouter from "./routes/exam.route.js";
import feeRouter from "./routes/fee.route.js";
import resultRouter from "./routes/result.route.js";
import salarySheetRouter from "./routes/salarySheet.route.js";
import staffRouter from "./routes/staff.route.js";
import studentRouter from "./routes/student.route.js";
import subjectRouter from "./routes/subject.route.js";
import transportationAreaRouter from "./routes/transportationArea.route.js";

const app = express();
// Create a writable stream (in append mode)
const logStream = fs.createWriteStream(
  path.join(path.resolve(), "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: logStream }));
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

app.get("/", (_, res) => {
  res.send("It is working fine");
});
app.use(`${API_PREFIX}/admin`, adminRouter);
app.use(`${API_PREFIX}/class`, classRouter);
app.use(`${API_PREFIX}/student`, studentRouter);
app.use(`${API_PREFIX}/subject`, subjectRouter);
app.use(`${API_PREFIX}/fee`, feeRouter);
app.use(`${API_PREFIX}/exam`, examRouter);
app.use(`${API_PREFIX}/result`, resultRouter);
app.use(`${API_PREFIX}/transportationArea`, transportationAreaRouter);
app.use(`${API_PREFIX}/bill`, billRouter);
app.use(`${API_PREFIX}/bill-fee`, billFeeRouter);
app.use(`${API_PREFIX}/staff`, staffRouter);
app.use(`${API_PREFIX}/salary-sheet`, salarySheetRouter);
app.use(`${API_PREFIX}/admin-control`, admminControlRouter);
export { app };
