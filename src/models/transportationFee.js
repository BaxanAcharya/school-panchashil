import mongoose from "mongoose";

const transportationFeeSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportationArea",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportationArea",
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const TransportationFee = mongoose.model(
  "TransportationFee",
  transportationFeeSchema
);
