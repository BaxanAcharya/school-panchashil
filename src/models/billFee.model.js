import mongoose from "mongoose";
import { BILL_FEE_LIST } from "../constant.js";
const billFeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: BILL_FEE_LIST,
    },
    amount: {
      type: Number,
      required: true,
    },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    interval: {
      type: Number,
      required: false,
      default: 0,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
  },
  { timestamps: true }
);
export default mongoose.model("BillFee", billFeeSchema);
