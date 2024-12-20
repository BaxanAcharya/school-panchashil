import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },

    taxPercentage: {
      type: Number,
      required: false,
      default: 1,
    },
    hasLeft: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Staff", staffSchema);
