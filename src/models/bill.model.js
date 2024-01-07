import mongoose from "mongoose";
import { NEPALI_MONTHS } from "../constant.js";
const billSchema = new mongoose.Schema(
  {
    billNo: {
      type: Number,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    student: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
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
    year: {
      type: Number,
      required: true,
    },
    admissionFee: {
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
      note: {
        type: String,
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
        default: "Diary/ID Card",
      },
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
