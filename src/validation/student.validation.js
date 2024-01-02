import mongoose from "mongoose";
import { GENDER_LIST } from "../constant.js";

const validateFullName = (fullName) => {
  if (!fullName) {
    return "Full Name is required";
  }
};

const validateFatherName = (fatherName) => {
  if (!fatherName) {
    return "Father Name is required";
  }
};

const validateMotherName = (motherName) => {
  if (!motherName) {
    return "Mother Name is required";
  }
};

const validateRollNumber = (rollNumber) => {
  if (!rollNumber) {
    return "Roll Number is required";
  }
};

const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return "Date of Birth is required";
  }
};

const validateAdmissionDate = (admissionDate) => {
  if (!admissionDate) {
    return "Admission Date is required";
  }
};

const validateGender = (gender) => {
  if (!gender) {
    return "Gender is required";
  }
  if (!GENDER_LIST.includes(gender)) {
    return `Gender must be on of ${GENDER_LIST}`;
  }
};

const validateGaurdianFullName = (gaurdianFullName) => {
  if (!gaurdianFullName) {
    return "Gaurdian Full Name is required";
  }
};

const validateGaurdianAddress = (gaurdianAddress) => {
  if (!gaurdianAddress) {
    return "Gaurdian Address is required";
  }
};

const validateGaurdianContactNumber = (gaurdianContactNumber) => {
  if (!gaurdianContactNumber) {
    return "Gaurdian Contact Number is required";
  }
};

const validateGaurdianProfession = (gaurdianProfession) => {
  if (!gaurdianProfession) {
    return "Gaurdian Profession is required";
  }
};

const validateClass = (classId) => {
  if (!classId) {
    return "Class is required";
  }

  const isValid = mongoose.Types.ObjectId.isValid(classId);
  if (!isValid) {
    return "Class is not valid";
  }
};

export {
  validateAdmissionDate,
  validateClass,
  validateDateOfBirth,
  validateFatherName,
  validateFullName,
  validateGaurdianAddress,
  validateGaurdianContactNumber,
  validateGaurdianFullName,
  validateGaurdianProfession,
  validateGender,
  validateMotherName,
  validateRollNumber,
};
