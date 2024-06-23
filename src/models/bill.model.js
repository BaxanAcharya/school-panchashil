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
        default: "Admission Fee (For new student only)",
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
        default: "Project/Sport/First Aid/Service Fee (Yearly)",
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
        default: "Stationary Fee (Monthly/Yearly)",
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
    transportation: {
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
      note: {
        type: String,
        default: "Transportation Fee",
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
    extra: {
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
      note: {
        type: String,
        default: "Extra Curricular Activities",
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

    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: false,
    },

    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    paidAmount: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
