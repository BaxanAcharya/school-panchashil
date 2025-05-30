import mongoose from "mongoose";
import { Class } from "../models/class.model.js";
import { Student } from "../models/student.model.js";
import { TransportationArea } from "../models/transportation.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";

import { UPGRADE_CLASS } from "../constant.js";
import { AdminControl } from "../models/admin-control.js";
import { uplaodOnBucket } from "../utils/bucket.js";
import {
  handlePaginationParams,
  makePaginatedResponse,
} from "../utils/HandlePagination.js";
import {
  validateAdmissionDate,
  validateClass,
  validateDateOfBirth,
  validateDestination,
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
    destination,
    feeDiscount,
    transportFeeDiscount,
    isNewStudent,
    admissionDiscount,
    stationaryFeeDiscount,
    serviceFeeDiscount,
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

  if (destination) {
    const isDestination = validateDestination(destination);
    if (isDestination) {
      return res.status(400).json(new GenericError(400, isDestination));
    }

    const destinationCheck = await TransportationArea.findById(destination);
    if (!destinationCheck) {
      return res
        .status(400)
        .json(new GenericError(400, "Destination not found"));
    }
  }

  const classCheck = validateClass(classId);
  if (classCheck) {
    return res.status(400).json(new GenericError(400, classCheck));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(400).json(new GenericError(400, "Class not found"));
  }

  const fileBuffer = req.file ? req.file.buffer : null;
  let image;
  if (fileBuffer) {
    image = await uplaodOnBucket(fileBuffer);
    if (!image) {
      return res
        .status(500)
        .json(new GenericError(500, "Error while uploading thumbnail."));
    }
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
    destination,
    feeDiscount: feeDiscount || 0,
    transportFeeDiscount: !destination ? 0 : transportFeeDiscount || 0,
    isNewStudent: isNewStudent || false,
    admissionDiscount: !isNewStudent ? 0 : admissionDiscount || 0,
    stationaryFeeDiscount: stationaryFeeDiscount || 0,
    serviceFeeDiscount: serviceFeeDiscount || 0,
    image,
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
    destination,
    feeDiscount,
    transportFeeDiscount,
    isNewStudent,
    dueAmount,
    admissionDiscount,
    stationaryFeeDiscount,
    serviceFeeDiscount,
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

  if (destination) {
    const isDestination = validateDestination(destination);
    if (isDestination) {
      return res.status(400).json(new GenericError(400, isDestination));
    }

    const destinationCheck = await TransportationArea.findById(destination);
    if (!destinationCheck) {
      return res
        .status(400)
        .json(new GenericError(400, "Destination not found"));
    }
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

  const fileBuffer = req.file ? req.file.buffer : null;
  let imageUrl;
  if (fileBuffer) {
    imageUrl = await uplaodOnBucket(fileBuffer);
    if (!imageUrl) {
      return res
        .status(500)
        .json(new GenericError(500, "Error while uploading thumbnail."));
    }
  }

  const updateData = {
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
    feeDiscount: feeDiscount || 0,
    transportFeeDiscount: !destination ? 0 : transportFeeDiscount || 0,
    isNewStudent: isNewStudent || false,
    dueAmount: dueAmount || 0,
    admissionDiscount: !isNewStudent ? 0 : admissionDiscount || 0,
    stationaryFeeDiscount: stationaryFeeDiscount || 0,
    serviceFeeDiscount: serviceFeeDiscount || 0,
    image: imageUrl || undefined,
  };

  if (destination !== undefined) {
    updateData.destination = destination;
  } else {
    updateData.$unset = { destination: "" };
  }

  const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedStudent) {
    return res.status(500).json(new GenericError(404, "Student not found"));
  }
  res
    .status(200)
    .json(
      new GenericReponse(200, "Student updated successfully", updatedStudent)
    );
});

const getStudents = handleAsync(async (req, res) => {
  const { options, dir } = handlePaginationParams(req);
  const studentsAggregate = Student.aggregate([
    {
      $match: {
        hasLeft: false,
        ...(req.query.class
          ? { class: new mongoose.Types.ObjectId(req.query.class) }
          : {}),
        ...(req.query.fullName
          ? { fullName: { $regex: req.query.fullName, $options: "i" } } // Case-insensitive search
          : {}),
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
      $lookup: {
        from: "transportationareas",
        localField: "destination",
        foreignField: "_id",
        as: "destinationValues",
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
        destinationValues: {
          $first: "$destinationValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
        destination: 0,
      },
    },
    {
      $sort: {
        rollNumber: dir, // Ensure "dir" is defined as 1 (asc) or -1 (desc)
      },
    },
  ]);

  // Use aggregatePaginate for pagination
  const students = await Student.aggregatePaginate(studentsAggregate, options);

  if (!students) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching students"));
  }

  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        "Students fetched successfully",
        makePaginatedResponse(students, dir)
      )
    );
});
const getLeftStudents = handleAsync(async (req, res) => {
  const { dir, options } = handlePaginationParams(req);
  const studentsPipeline = Student.aggregate([
    {
      $match: {
        hasLeft: true,
        ...(req.query.fullName
          ? { fullName: { $regex: req.query.fullName, $options: "i" } } // Case-insensitive search
          : {}),
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
    {
      $sort: {
        rollNumber: dir,
      },
    },
  ]);

  const students = await Student.aggregatePaginate(studentsPipeline, options);
  if (!students) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching students"));
  }

  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        "Left Student fetched successfully",
        makePaginatedResponse(students, dir)
      )
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
      $lookup: {
        from: "transportationareas",
        localField: "destination",
        foreignField: "_id",
        as: "destinationValues",
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
        destinationValues: {
          $first: "$destinationValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
        destination: 0,
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

const makeStudentUnLeave = handleAsync(async (req, res) => {
  const { id } = req.params;

  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const student = await Student.findByIdAndUpdate(
    id,
    {
      hasLeft: false,
    },
    { new: true }
  );
  if (!student) {
    return res.status(404).json(new GenericError(404, "Student not found"));
  }
  return res
    .status(200)
    .json(
      new GenericReponse(200, "Student made unleave successfully", student)
    );
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
      $lookup: {
        from: "transportationareas",
        localField: "destination",
        foreignField: "_id",
        as: "destinationValues",
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
        destinationValues: {
          $first: "$destinationValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
        destination: 0,
      },
    },
    {
      $sort: {
        rollNumber: 1,
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

const upgradeStudentClass = handleAsync(async (req, res) => {
  const { fromClassId, toClassId } = req.params;
  const isValidFromClassId = mongoose.isValidObjectId(fromClassId);
  const isValidToClassId = mongoose.isValidObjectId(toClassId);
  if (!isValidFromClassId || !isValidToClassId) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }

  if (fromClassId === toClassId) {
    return res
      .status(400)
      .json(new GenericError(400, "Cannot upgrade to same class"));
  }

  const isExist = await AdminControl.findOne({
    func: UPGRADE_CLASS,
  });

  if (!isExist) {
    return res
      .status(400)
      .json(
        new GenericError(400, "Upgrade class locked, contact Biplab first")
      );
  } else if (!isExist.active) {
    return res
      .status(400)
      .json(
        new GenericError(400, "Upgrade class locked, contact Biplab first")
      );
  }

  const fromClass = await Class.findById(fromClassId);
  if (!fromClass) {
    return res.status(404).json(new GenericError(404, "From class not found"));
  }

  const toClass = await Class.findById(toClassId);
  if (!toClass) {
    return res.status(404).json(new GenericError(404, "To class not found"));
  }
  const students = await Student.updateMany(
    { class: fromClassId },
    { class: toClassId }
  );
  if (!students) {
    return res.status(404).json(new GenericError(404, "Students not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Students upgraded successfully", {}));
});

export {
  addStudent,
  deleteStudentById,
  getLeftStudents,
  getStudentByClass,
  getStudentById,
  getStudents,
  makeStudentLeave,
  makeStudentUnLeave,
  updateStudentById,
  upgradeStudentClass,
};
