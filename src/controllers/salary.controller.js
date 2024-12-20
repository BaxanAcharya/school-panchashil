import mongoose from "mongoose";
import SalarySheet from "../models/salarySheet.model.js";
import Staff from "../models/staff.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import { validateMonth, validateYear } from "../validation/bill.validation.js";

const addSalarySheet = handleAsync(async (req, res) => {
  const {
    staffId,
    month,
    year,
    absentDays,
    kidFee,
    advance,
    oldDue,
    totalWorkingDays,
  } = req.body;
  if (!staffId) {
    return res.status(400).json(new GenericError(400, "Staff id is required"));
  }
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json(new GenericError(400, "Invalid staff id"));
  }

  const isValidMonth = validateMonth(month);
  if (isValidMonth) {
    return res.status(400).json(new GenericError(400, isValidMonth));
  }
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }

  if (typeof absentDays !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Absent days is required"));
  }

  if (typeof kidFee !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Kid fee must be a number"));
  }

  if (typeof advance !== "number") {
    return res.status(400).json(new GenericError(400, "Advance is required"));
  }
  if (typeof oldDue !== "number") {
    return res.status(400).json(new GenericError(400, "Old due is required"));
  }
  if (typeof totalWorkingDays !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Total working days is required"));
  }

  const staff = await Staff.findById(staffId);
  if (!staff) {
    return res.status(404).json(new GenericError(404, "Staff not found"));
  }

  const isSalarySheet = await SalarySheet.findOne({
    staff: staffId,
    month,
    year,
  });
  if (isSalarySheet) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          `Salary sheet already exists for ${staff.name} in ${month}, ${year}`
        )
      );
  }

  const salary = staff.salary;
  const oneDaySalary = salary / totalWorkingDays;

  let absentDaySalary = 0;

  if (absentDays > 1) {
    absentDaySalary = oneDaySalary * absentDays - 1;
  }

  const salaryOfPresentDays = salary - absentDaySalary;

  const tax = (salary * staff.taxPercentage) / 100;
  const receivedAmount = salaryOfPresentDays - tax - kidFee - oldDue - advance;

  const newSalarySheet = await SalarySheet.create({
    staff: staffId,
    month,
    year,
    absentDays,
    salary,
    kidFee,
    tax,
    advance,
    oldDue,
    receivedAmount,
  });

  res
    .status(201)
    .json(
      new GenericReponse(
        201,
        `Salary sheet added for ${staff.name} in ${month}, ${year}`,
        newSalarySheet
      )
    );
});
const getSalarySheets = handleAsync(async (req, res) => {});
const getSalarySheetById = handleAsync(async (req, res) => {});
const updateSalarySheet = handleAsync(async (req, res) => {});
const deleteSalarySheet = handleAsync(async (req, res) => {});

export {
  addSalarySheet,
  deleteSalarySheet,
  getSalarySheetById,
  getSalarySheets,
  updateSalarySheet,
};
