import mongoose from "mongoose";
import { Exam } from "../models/exam.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import { validateName, validateYear } from "../validation/exam.validation.js";

const addExam = handleAsync(async (req, res) => {
  const { name, year, description } = req.body;
  const isValidName = validateName(name);
  if (isValidName) {
    return res.status(400).json(new GenericError(400, isValidName));
  }
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }

  const examExists = await Exam.findOne({ name: name.toUpperCase(), year });
  if (examExists) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          `Exam with name ${name.toUpperCase()} and year ${year} already exists `
        )
      );
  }
  const exam = await Exam.create({ name, year, description });
  if (!exam) {
    return res.status(400).json(new GenericError(400, "Something went wrong"));
  }

  return res.status(201).json(new GenericReponse(201, "Exam created", exam));
});
const getExams = handleAsync(async (_, res) => {
  const exams = await Exam.find();
  if (!exams) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }
  return res.status(200).json(new GenericReponse(200, "Exams", exams));
});
const getExamByYear = handleAsync(async (req, res) => {
  const { year } = req.params;
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }
  const exam = await Exam.find({ year });
  if (!exam) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }
  return res.status(200).json(new GenericReponse(200, "Exam", exam));
});
const getExamById = handleAsync(async (req, res) => {
  const { id } = req.params;
  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const exam = await Exam.findById(id);
  if (!exam) {
    return res
      .status(404)
      .json(new GenericError(404, `Exam with id ${id} not found`));
  }
  return res.status(200).json(new GenericReponse(200, "Exam", exam));
});
const updateExam = handleAsync(async (req, res) => {
  const { id } = req.params;
  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const { name, year, description } = req.body;
  const isValidName = validateName(name);
  if (isValidName) {
    return res.status(400).json(new GenericError(400, isValidName));
  }
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }

  const examExists = await Exam.findOne({ name: name.toUpperCase(), year });
  if (examExists) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          `Exam with name ${name.toUpperCase()} and year ${year} already exists `
        )
      );
  }

  const exam = await Exam.findByIdAndUpdate(
    id,
    { name, year, description },
    { new: true }
  );
  if (!exam) {
    return res
      .status(404)
      .json(new GenericError(404, `Exam with id ${id} not found`));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Exam updated successfully", {}));
});

const deleteExam = handleAsync(async (req, res) => {
  const { id } = req.params;
  const isValidId = mongoose.isValidObjectId(id);
  if (!isValidId) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const exam = await Exam.findByIdAndDelete(id);
  if (!exam) {
    return res
      .status(404)
      .json(new GenericError(404, `Exam with id ${id} not found`));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Exam deleted successfully", {}));
});

export {
  addExam,
  deleteExam,
  getExamById,
  getExamByYear,
  getExams,
  updateExam,
};
