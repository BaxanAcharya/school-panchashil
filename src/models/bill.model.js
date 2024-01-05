import mongoose from "mongoose";
import { NEPALI_MONTHS } from "../constant.js";
const billSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  student: {
    name: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    rollNo: {
      type: Number,
      required: true,
    },
  },
  month: {
    type: Number,
    required: true,
    enum: [NEPALI_MONTHS],
  },
});

export default mongoose.model("Bill", billSchema);
