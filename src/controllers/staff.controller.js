import mongoose from "mongoose";
import Staff from "../models/staff.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";

const addStaff = handleAsync(async (req, res) => {
  const { name, salary, designation } = req.body;
  if (!name) {
    return res.status(400).json(new GenericError(400, "Name is required"));
  }
  if (typeof salary !== "number" || salary <= 0) {
    return res.status(400).json(new GenericError(400, "Salary is required"));
  }

  if (!designation) {
    return res
      .status(400)
      .json(new GenericError(400, "Designation is required"));
  }

  const newStaff = await new Staff({
    name,
    salary,
    designation,
  }).save();

  return res.status(201).json(new GenericReponse(201, "Staff added", newStaff));
});

const getStaffs = handleAsync(async (req, res) => {
  const { left } = req.query;
  let filter = {};
  if (left) {
    filter = left === "true" ? { hasLeft: true } : { hasLeft: false };
  }
  const staffs = await Staff.find(filter);
  return res.status(200).json(new GenericReponse(200, "Staffs", staffs));
});

const getStaffById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const staff = await Staff.findById(id);
  if (!staff) {
    return res.status(404).json(new GenericError(404, "Staff not found"));
  }
  return res.status(200).json(new GenericReponse(200, "Staff", staff));
});

const updateStaff = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const staff = await Staff.findById(id);
  if (!staff) {
    return res.status(404).json(new GenericError(404, "Staff not found"));
  }
  const { name, salary, designation } = req.body;
  if (!name) {
    return res.status(400).json(new GenericError(400, "Name is required"));
  }
  if (typeof salary !== "number" || salary <= 0) {
    return res.status(400).json(new GenericError(400, "Salary is required"));
  }
  if (!designation) {
    return res
      .status(400)
      .json(new GenericError(400, "Designation is required"));
  }

  if (name) {
    staff.name = name;
  }
  if (salary !== undefined || salary !== null) {
    staff.salary = salary;
  }
  if (designation) {
    staff.designation = designation;
  }

  await staff.save();
  return res.status(200).json(new GenericReponse(200, "Staff updated", staff));
});

const makeStaffLeave = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }
  const staff = await Staff.findById(id);
  if (!staff) {
    return res.status(404).json(new GenericError(404, "Staff not found"));
  }
  staff.hasLeft = !staff.hasLeft;
  await staff.save();
  return res.status(200).json(new GenericReponse(200, "Staff left", staff));
});

export { addStaff, getStaffById, getStaffs, makeStaffLeave, updateStaff };
