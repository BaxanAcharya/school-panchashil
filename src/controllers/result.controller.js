import mongoose from "mongoose";
import { Class } from "../models/class.model.js";
import { Exam } from "../models/exam.model.js";
import Result from "../models/result.model.js";
import { Student } from "../models/student.model.js";
import { Subject } from "../models/subject.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { getGpa, getGrade, getRemarks } from "../utils/Grading.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  validAttendence,
  validClass,
  validExam,
  validMarks,
  validStudent,
} from "../validation/mark.validation.js";

const addResult = handleAsync(async (req, res) => {
  const { student, class: classId, exam, marks, attendence } = req.body;
  const isValidStudent = validStudent(student);
  if (isValidStudent) {
    return res.status(400).json(new GenericError(400, isValidStudent));
  }

  if (!mongoose.Types.ObjectId.isValid(student)) {
    return res.status(400).json(new GenericError(440, "Invalid student id"));
  }
  const isValidClass = validClass(classId);
  if (isValidClass) {
    return res.status(400).json(new GenericError(400, isValidClass));
  }
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new GenericError(400, "Invalid class id"));
  }

  const isValidExam = validExam(exam);
  if (isValidExam) {
    return res.status(400).json(new GenericError(400, isValidExam));
  }
  if (!mongoose.Types.ObjectId.isValid(exam)) {
    return res.status(400).json(new GenericError(400, "Invalid exam id"));
  }

  const isValidMarks = validMarks(marks);
  if (isValidMarks) {
    return res.status(400).json(new GenericError(400, isValidMarks));
  }

  const isValidAttendence = validAttendence(attendence);
  if (isValidAttendence) {
    return res.status(400).json(new GenericError(400, isValidAttendence));
  }

  const resultExist = await Result.findOne({ student, class: classId, exam });
  if (resultExist) {
    return res.status(409).json(new GenericError(409, "Result already exists"));
  }

  const isStudent = await Student.findById(student);
  if (!isStudent) {
    return res.status(404).json(new GenericError(404, "Student not found"));
  }
  const isClass = await Class.findById(classId);

  if (!isClass) {
    return res.status(404).json(new GenericError(404, "Class not found"));
  }
  const isExam = await Exam.findById(exam);
  if (!isExam) {
    return res.status(404).json(new GenericError(404, "Exam not found"));
  }
  const subjectIds = marks.map((mark) => mark.subject);
  const subjects = await Subject.find({ _id: { $in: subjectIds } });

  if (subjects.length !== subjectIds.length) {
    return res
      .status(404)
      .json(new GenericError(404, "One or more subjects not found"));
  }

  const newMarks = subjects.map((subject) => {
    const mark = marks.find((mark) => mark.subject === subject._id.toString());
    return {
      subject: subject.name,
      fullMarks: subject.fullMarks,
      mark: mark.mark,
    };
  });

  const totalSubjectMarks = newMarks.reduce(
    (total, subject) => total + subject.fullMarks,
    0
  );

  const totalMarksObtained = newMarks.reduce(
    (total, subject) => total + subject.mark,
    0
  );
  const roundedPercentage = (totalMarksObtained / totalSubjectMarks) * 100;
  const percentage =
    roundedPercentage % 1 === 0
      ? roundedPercentage.toFixed(0)
      : roundedPercentage.toFixed(2);

  const grade = getGrade(totalMarksObtained, totalSubjectMarks);
  const gpa = getGpa(totalMarksObtained, totalSubjectMarks);

  const remarks = getRemarks(grade);

  const result = await Result.create({
    student,
    class: classId,
    exam,
    marks: newMarks,
    total: totalMarksObtained,
    percentage,
    grade,
    gpa,
    remarks,
    attendence,
  });
  if (!result) {
    return res.status(500).json(new GenericError(500, "Internal server error"));
  }
  return res.status(201).json(new GenericReponse(201, "Result added", result));
});
const getResults = handleAsync(async (req, res) => {
  const { student, class: classId, exam } = req.query;
  const query = {};
  if (student) {
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json(new GenericError(400, "Invalid student id"));
    }
    query.student = student;
  }
  if (classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json(new GenericError(400, "Invalid class id"));
    }
    query.class = classId;
  }
  if (exam) {
    if (!mongoose.Types.ObjectId.isValid(exam)) {
      return res.status(400).json(new GenericError(400, "Invalid exam id"));
    }
    query.exam = exam;
  }
  const results = await Result.find(query)
    .populate({
      path: "student",
      select: "fullName fatherName rollNumber",
    })
    .populate("class", "name section")
    .populate("exam", "name year");
  if (!results) {
    return res.status(500).json(new GenericError(500, "Internal server error"));
  }
  return res.status(200).json(new GenericReponse(200, "Results", results));
});
const getResultById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid result id"));
  }
  const result = await Result.findById(id)
    .populate({
      path: "student",
      select: "fullName fatherName rollNumber",
    })
    .populate("class", "name section")
    .populate("exam", "name year");
  if (!result) {
    return res.status(404).json(new GenericError(404, "Result not found"));
  }
  return res.status(200).json(new GenericReponse(200, "Result", result));
});
const deleteResult = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid result id"));
  }
  const result = await Result.findByIdAndDelete(id);
  if (!result) {
    return res.status(404).json(new GenericError(404, "Result not found"));
  }
  return res.status(200).json(new GenericReponse(200, "Result deleted", {}));
});

const updateResult = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid result id"));
  }
  const { marks, attendence } = req.body;
  const isValidMarks = validMarks(marks);
  if (isValidMarks) {
    return res.status(400).json(new GenericError(400, isValidMarks));
  }

  const subjectIds = marks.map((mark) => mark.subject);
  const subjects = await Subject.find({ _id: { $in: subjectIds } });

  if (subjects.length !== subjectIds.length) {
    return res
      .status(404)
      .json(new GenericError(404, "One or more subjects not found"));
  }

  const newMarks = subjects.map((subject) => {
    const mark = marks.find((mark) => mark.subject === subject._id.toString());
    return {
      subject: subject.name,
      fullMarks: subject.fullMarks,
      mark: mark.mark,
    };
  });

  const totalSubjectMarks = newMarks.reduce(
    (total, subject) => total + subject.fullMarks,
    0
  );

  const totalMarksObtained = newMarks.reduce(
    (total, subject) => total + subject.mark,
    0
  );
  const roundedPercentage = (totalMarksObtained / totalSubjectMarks) * 100;
  const percentage =
    roundedPercentage % 1 === 0
      ? roundedPercentage.toFixed(0)
      : roundedPercentage.toFixed(2);

  const grade = getGrade(totalMarksObtained, totalSubjectMarks);
  const gpa = getGpa(totalMarksObtained, totalSubjectMarks);

  const remarks = getRemarks(grade);

  const result = await Result.findByIdAndUpdate(
    id,
    {
      marks: newMarks,
      total: totalMarksObtained,
      percentage,
      grade,
      gpa,
      remarks,
      attendence,
    },
    { new: true }
  )
    .populate({
      path: "student",
      select: "fullName fatherName rollNumber",
    })
    .populate("class", "name section")
    .populate("exam", "name year");
  if (!result) {
    return res.status(404).json(new GenericError(404, "Result not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Result updated", result));
});

export { addResult, deleteResult, getResultById, getResults, updateResult };
