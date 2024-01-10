import mongoose from "mongoose";
const resultSchema = new mongoose.Schema(
  {
    student: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      rollNo: {
        type: Number,
        required: true,
      },
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    marks: [
      {
        subject: {
          type: String,
          required: true,
        },

        fullMarks: {
          type: Number,
          required: true,
        },

        mark: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    gpa: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    attendence: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: false,
    },
  },

  { timestamps: true }
);
const Result = mongoose.model("Result", resultSchema);
export default Result;
