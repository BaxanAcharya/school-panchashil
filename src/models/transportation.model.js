import mongoose from "mongoose";

const transportationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Vehicle", "Walking"],
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Transportation = mongoose.model(
  "Transportation",
  transportationSchema
);
