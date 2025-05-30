import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const salarySheetSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    salary: {
      type: Number,
      default: 0,
    },
    kidFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    oldDue: {
      type: Number,
      default: 0,
    },
    receivedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

salarySheetSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model("SalarySheet", salarySheetSchema);
