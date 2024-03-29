import mongoose from "mongoose";
import { Class } from "../models/class.model.js";
import { Student } from "../models/student.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
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
} from "../validation/student.validation.js";

const addStudent = handleAsync(async (req, res) => {
  const {
    fullName,
    fatherName,
    motherName,
    rollNumber,
    dateOfBirth,
    admissionDate,
    gender,
    previousSchool,
    physicalDisability,
    gaurdianFullName,
    gaurdianAddress,
    gaurdianContactNumber,
    gaurdianProfession,
    class: classId,
  } = req.body;

  const fullNameCheck = validateFullName(fullName);
  if (fullNameCheck) {
    return res.status(400).json(new GenericError(400, fullNameCheck));
  }

  const fatherNameCheck = validateFatherName(fatherName);
  if (fatherNameCheck) {
    return res.status(400).json(new GenericError(400, fatherNameCheck));
  }
  const motherNameCheck = validateMotherName(motherName);
  if (motherNameCheck) {
    return res.status(400).json(new GenericError(400, motherNameCheck));
  }
  const rollNumberCheck = validateRollNumber(rollNumber);
  if (rollNumberCheck) {
    return res.status(400).json(new GenericError(400, rollNumberCheck));
  }
  const dateOfBirthCheck = validateDateOfBirth(dateOfBirth);
  if (dateOfBirthCheck) {
    return res.status(400).json(new GenericError(400, dateOfBirthCheck));
  }

  const admissionDateCheck = validateAdmissionDate(admissionDate);
  if (admissionDateCheck) {
    return res.status(400).json(new GenericError(400, admissionDateCheck));
  }
  const genderCheck = validateGender(gender);
  if (genderCheck) {
    return res.status(400).json(new GenericError(400, genderCheck));
  }

  const gaurdianFullNameCheck = validateGaurdianFullName(gaurdianFullName);
  if (gaurdianFullNameCheck) {
    return res.status(400).json(new GenericError(400, gaurdianFullNameCheck));
  }
  const gaurdianAddressCheck = validateGaurdianAddress(gaurdianAddress);
  if (gaurdianAddressCheck) {
    return res.status(400).json(new GenericError(400, gaurdianAddressCheck));
  }

  const gaurdianContactNumberCheck = validateGaurdianContactNumber(
    gaurdianContactNumber
  );

  if (gaurdianContactNumberCheck) {
    return res
      .status(400)
      .json(new GenericError(400, gaurdianContactNumberCheck));
  }

  const gaurdianProfessionCheck =
    validateGaurdianProfession(gaurdianProfession);
  if (gaurdianProfessionCheck) {
    return res.status(400).json(new GenericError(400, gaurdianProfessionCheck));
  }

  const classCheck = validateClass(classId);
  if (classCheck) {
    return res.status(400).json(new GenericError(400, classCheck));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(400).json(new GenericError(400, "Class not found"));
  }
  const student = await Student.create({
    fullName,
    fatherName,
    motherName,
    rollNumber,
    dateOfBirth,
    admissionDate,
    gender,
    previousSchool,
    physicalDisability,
    gaurdianFullName,
    gaurdianAddress,
    gaurdianContactNumber,
    gaurdianProfession,
    class: classId,
  });
  if (!student) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while saving student."));
  }

  return res
    .status(201)
    .json(new GenericReponse(201, "Student Created SuccessFully", student));
});

const deleteStudentById = handleAsync(async (req, res) => {
  const { id } = req.params;
  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const student = await Student.findByIdAndDelete(id);
  if (!student) {
    return res.status(404).json(new GenericError(404, "Student not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Student deleted successfully", {}));
});

const updateStudentById = handleAsync(async (req, res) => {
  const {
    fullName,
    fatherName,
    motherName,
    rollNumber,
    dateOfBirth,
    admissionDate,
    gender,
    previousSchool,
    physicalDisability,
    gaurdianFullName,
    gaurdianAddress,
    gaurdianContactNumber,
    gaurdianProfession,
    class: classId,
  } = req.body;

  const fullNameCheck = validateFullName(fullName);
  if (fullNameCheck) {
    return res.status(400).json(new GenericError(400, fullNameCheck));
  }

  const fatherNameCheck = validateFatherName(fatherName);
  if (fatherNameCheck) {
    return res.status(400).json(new GenericError(400, fatherNameCheck));
  }
  const motherNameCheck = validateMotherName(motherName);
  if (motherNameCheck) {
    return res.status(400).json(new GenericError(400, motherNameCheck));
  }
  const rollNumberCheck = validateRollNumber(rollNumber);
  if (rollNumberCheck) {
    return res.status(400).json(new GenericError(400, rollNumberCheck));
  }
  const dateOfBirthCheck = validateDateOfBirth(dateOfBirth);
  if (dateOfBirthCheck) {
    return res.status(400).json(new GenericError(400, dateOfBirthCheck));
  }

  const admissionDateCheck = validateAdmissionDate(admissionDate);
  if (admissionDateCheck) {
    return res.status(400).json(new GenericError(400, admissionDateCheck));
  }
  const genderCheck = validateGender(gender);
  if (genderCheck) {
    return res.status(400).json(new GenericError(400, genderCheck));
  }

  const gaurdianFullNameCheck = validateGaurdianFullName(gaurdianFullName);
  if (gaurdianFullNameCheck) {
    return res.status(400).json(new GenericError(400, gaurdianFullNameCheck));
  }
  const gaurdianAddressCheck = validateGaurdianAddress(gaurdianAddress);
  if (gaurdianAddressCheck) {
    return res.status(400).json(new GenericError(400, gaurdianAddressCheck));
  }

  const gaurdianContactNumberCheck = validateGaurdianContactNumber(
    gaurdianContactNumber
  );

  if (gaurdianContactNumberCheck) {
    return res
      .status(400)
      .json(new GenericError(400, gaurdianContactNumberCheck));
  }

  const gaurdianProfessionCheck =
    validateGaurdianProfession(gaurdianProfession);
  if (gaurdianProfessionCheck) {
    return res.status(400).json(new GenericError(400, gaurdianProfessionCheck));
  }

  const classCheck = validateClass(classId);
  if (classCheck) {
    return res.status(400).json(new GenericError(400, classCheck));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(400).json(new GenericError(400, "Class not found"));
  }

  const { id } = req.params;
  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    {
      $set: {
        fullName,
        fatherName,
        motherName,
        rollNumber,
        dateOfBirth,
        admissionDate,
        gender,
        previousSchool,
        physicalDisability,
        gaurdianFullName,
        gaurdianAddress,
        gaurdianContactNumber,
        gaurdianProfession,
        class: classId,
      },
    },
    { new: true }
  );

  if (!updatedStudent) {
    return res.status(500).json(new GenericError(404, "Student not found"));
  }
  res
    .status(200)
    .json(
      new GenericReponse(200, "Student updated successfully", updatedStudent)
    );
});

const getStudents = handleAsync(async (_, res) => {
  const students = await Student.aggregate([
    {
      $match: {
        hasLeft: false,
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!students) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching students"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Students fetched successfully", students));
});
const getLeftStudents = handleAsync(async (_, res) => {
  const students = await Student.aggregate([
    {
      $match: {
        hasLeft: true,
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!students) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching students"));
  }
  return res
    .status(200)
    .json(
      new GenericReponse(200, "Left Student fetched successfully", students)
    );
});

const getStudentById = handleAsync(async (req, res) => {
  const { id } = req.params;

  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const student = await Student.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!student[0]) {
    return res.status(404).json(new GenericError(404, "Student not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Student fetched successfully", student[0]));
});

const makeStudentLeave = handleAsync(async (req, res) => {
  const { id } = req.params;

  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const student = await Student.findByIdAndUpdate(
    id,
    {
      hasLeft: true,
    },
    { new: true }
  );
  if (!student) {
    return res.status(404).json(new GenericError(404, "Student not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Student made leave successfully", student));
});

const getStudentByClass = handleAsync(async (req, res) => {
  const { classId: id } = req.params;
  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const students = await Student.aggregate([
    {
      $match: {
        class: new mongoose.Types.ObjectId(id),
        hasLeft: false,
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!students) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching students"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Students fetched successfully", students));
});

export {
  addStudent,
  deleteStudentById,
  getLeftStudents,
  getStudentByClass,
  getStudentById,
  getStudents,
  makeStudentLeave,
  updateStudentById,
};
