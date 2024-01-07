import mongoose from "mongoose";
import { NEPALI_MONTHS } from "../constant.js";
const billSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  student: {
    id: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    rollNo: {
      type: Number,
      required: true,
    },
  },
  month: {
    type: Number,
    required: true,
    enum: [NEPALI_MONTHS],
  },
  admissionFee: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Admission Fee (Yearly for new student only)",
    },
  },
  serviceFee: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Project/Sport/First Aid/Extra Curricular Fee (Yearly)",
    },
  },
  schoolFee: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "School Fee (Monthly)",
    },
  },
  stationaryFee: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Stationary Fee (Monthly)",
    },
  },
  deposit: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Deposit (Refundable)",
    },
  },
  snack: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Snack (Monthly)",
    },
  },
  transportation: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Transportation Fee (Monthly)",
    },
  },
  evaluation: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Evaluation (Term/unit wise)",
    },
  },
  care: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: true,
      default: "Care/Day Hotel (Monthly) Fee",
    },
  },
  due: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: false,
      default: "Old Due",
    },
  },
  diary: {
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    note: {
      type: String,
      required: false,
      default: "Diary/ID Card",
    },
  },
  total: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("Bill", billSchema);
