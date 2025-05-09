import mongoose from "mongoose";
const adminControlSchema = new mongoose.Schema(
  {
    func: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export const AdminControl = mongoose.model("AdminControl", adminControlSchema);
