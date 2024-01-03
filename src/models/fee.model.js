import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const feeSchema = new mongoose.Schema({
  feeAmount: {
    type: Number,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    unique: true,
  },
});
feeSchema.plugin(mongooseAggregatePaginate);
export const Fee = mongoose.model("Fee", feeSchema);
