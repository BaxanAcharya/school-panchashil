import mongoose from "mongoose";

const transportationAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const TransportationArea = mongoose.model(
  "TransportationArea",
  transportationAreaSchema
);
