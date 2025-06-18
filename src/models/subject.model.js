import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

subjectSchema.plugin(mongooseAggregatePaginate);

export const Subject = mongoose.model("Subject", subjectSchema);
