import mongoose from "mongoose";
const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
  },

  {
    rollNumber: {
      type: Number,
      required: true,
    },
  },

  {
    dateOfBirth: {
      type: Date,
      required: true,
    },
  },
  {
    admissionDate: {
      type: Date,
      required: true,
    },
  },
  {
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
  },
  {
    previousSchool: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    physicalDisability: {
      type: Boolean,
      required: false,
      trim: true,
    },
  },
  {
    gaurdianFullName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    gaurdianAddress: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    gaurdianContactNumber: {
      type: Number,
      required: true,
    },
  },
  {
    gaurdianProfession: {
      type: String,
      required: true,
      trim: true,
    },
  },

  {
    transportationType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transportation",
    },
  },
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  },

  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
