import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullMarks: {
      type: Number,
      required: true,
    },
    displayOrder: {
      type: Number,
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);
