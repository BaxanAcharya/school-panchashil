import mongoose from "mongoose";
import { NEPALI_MONTHS } from "../constant.js";

const validateStudent = (student) => {
  if (!student) {
    return "Student is required";
  }
  if (typeof student !== "object") {
    return "Student must be an object";
  }

  if (!student.id) {
    return "Student Id is required";
  }
  if (!mongoose.Types.ObjectId.isValid(student.id)) {
    return "Student is not valid";
  }
  if (!student.class) {
    return "Student class is required";
  }
  if (!mongoose.Types.ObjectId.isValid(student.class)) {
    return "Student class is not valid";
  }
};

const validateMonth = (month) => {
  if (!month) {
    return "Month is required";
  }
  if (typeof month !== "number") {
    return "Month must be a number";
  }
  if (!NEPALI_MONTHS.includes(month)) {
    return `Month must be one of ${NEPALI_MONTHS}`;
  }
};

const validateYear = (year) => {
  if (!year) {
    return "Year is required";
  }
  if (typeof year !== "number") {
    return "Year must be a number";
  }
};

export { validateMonth, validateStudent, validateYear };
