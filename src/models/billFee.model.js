import mongoose from "mongoose";
import { BILL_FEE_LIST } from "../constant.js";
const billFeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: BILL_FEE_LIST,
  },
  amount: {
    type: Number,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: false,
  },
  interval: {
    type: Number,
    required: false,
    default: 0,
  },
});
export default mongoose.model("BillFee", billFeeSchema);
