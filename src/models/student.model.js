import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { GENDER_LIST } from "../constant.js";

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: Number,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    admissionDate: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: GENDER_LIST,
      required: true,
    },
    previousSchool: {
      type: String,
      required: false,
      trim: true,
    },
    physicalDisability: {
      type: String,
      required: false,
      trim: true,
    },
    gaurdianFullName: {
      type: String,
      required: true,
      trim: true,
    },
    gaurdianAddress: {
      type: String,
      required: true,
      trim: true,
    },
    gaurdianContactNumber: {
      type: Number,
      required: true,
    },
    gaurdianProfession: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportationArea",
      required: false,
    },
    hasLeft: {
      type: Boolean,
      default: false,
    },

    feeDiscount: {
      type: Number,
      default: 0,
    },
    transportFeeDiscount: {
      type: Number,
      default: 0,
    },
    isNewStudent: {
      type: Boolean,
      default: false,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    admissionDiscount: {
      type: Number,
      default: 0,
    },
    stationaryFeeDiscount: {
      type: Number,
      default: 0,
    },
    serviceFeeDiscount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

studentSchema.plugin(mongooseAggregatePaginate);

export const Student = mongoose.model("Student", studentSchema);
