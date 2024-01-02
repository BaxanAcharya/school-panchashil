import mongoose from "mongoose";
import { SECTION_LIST } from "../constant.js";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      enum: SECTION_LIST,
      required: true,
    },
  },
  { timestamps: true }
);

export const Class = mongoose.model("Class", classSchema);
