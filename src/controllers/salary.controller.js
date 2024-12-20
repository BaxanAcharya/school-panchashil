import mongoose from "mongoose";
import SalarySheet from "../models/salarySheet.model.js";
import Staff from "../models/staff.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  handlePaginationParams,
  makePaginatedResponse,
} from "../utils/HandlePagination.js";
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

  return res
    .status(201)
    .json(
      new GenericReponse(
        201,
        `Salary sheet added for ${staff.name} in ${month}, ${year}`,
        newSalarySheet
      )
    );
});

const addSalarySheetBulk = handleAsync(async (req, res) => {
  const items = req.body;

  const { month, year } = req.query;

  if (!month) {
    return res.status(400).json(new GenericError(400, "Month is required"));
  }

  if (!year) {
    return res.status(400).json(new GenericError(400, "Year is required"));
  }

  if (!Array.isArray(items)) {
    return res
      .status(400)
      .json(new GenericError(400, "Body should be an array"));
  }

  if (items.length === 0) {
    return res
      .status(400)
      .json(new GenericError(400, "Body should not be empty"));
  }

  let cleanStaffObject = [];
  let cleanStaff = [];
  items.forEach((item) => {
    const s = cleanStaffObject.find((x) => x.staffId === item.staffId);
    if (!s) {
      cleanStaffObject.push(item);
      cleanStaff.push(item.staffId);
    }
  });

  if (cleanStaffObject.length !== cleanStaff.length) {
    return res
      .status(400)
      .json(new GenericError(400, "Duplicate staff id found"));
  }

  const staffs = await Staff.find({ _id: { $in: cleanStaff } });

  if (staffs.length !== cleanStaff.length) {
    return res.status(400).json(new GenericError(400, "Staff not found"));
  }

  const checkSalarySheet = await SalarySheet.find({
    staff: { $in: cleanStaff },
    month: parseInt(month),
    year: parseInt(year),
  });

  if (checkSalarySheet.length > 0) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          "Salary sheet already exists for some staff in this month"
        )
      );
  }

  const newSalarySheets = [];
  console.log(staffs);

  items.forEach((item) => {
    const staff = staffs.find(
      (x) => x._id.toString() === item.staffId.toString()
    );

    if (!staff) {
      return res.status(400).json(new GenericError(400, "Staff not found"));
    }
    const salary = staff.salary;
    const oneDaySalary = salary / item.totalWorkingDays;

    let absentDaySalary = 0;

    if (item.absentDays > 1) {
      absentDaySalary = oneDaySalary * item.absentDays - 1;
    }

    const salaryOfPresentDays = salary - absentDaySalary;

    const tax = (salary * staff.taxPercentage) / 100;
    const receivedAmount =
      salaryOfPresentDays - tax - item.kidFee - item.oldDue - item.advance;

    newSalarySheets.push({
      staff: item.staffId,
      month: parseInt(month),
      year: parseInt(year),
      absentDays: item.absentDays,
      salary,
      kidFee: item.kidFee,
      tax,
      advance: item.advance,
      oldDue: item.oldDue,
      receivedAmount,
    });
  });

  const createdSalarySheets = await SalarySheet.insertMany(newSalarySheets);

  return res
    .status(201)
    .json(
      new GenericReponse(
        201,
        "Salary sheets added successfully",
        createdSalarySheets
      )
    );
});
const getSalarySheets = handleAsync(async (req, res) => {
  const { options, dir } = handlePaginationParams(req);

  const salarySheet = await SalarySheet.aggregatePaginate(
    SalarySheet.aggregate([
      {
        $match: {
          ...(req.query.year ? { year: parseInt(req.query.year) } : {}),
          ...(req.query.month ? { month: parseInt(req.query.month) } : {}),
        },
      },
      {
        $lookup: {
          from: "staffs", // Assuming the collection name for Staff is 'staffs'
          localField: "staff",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      {
        $unwind: {
          path: "$staffDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...(req.query.name
            ? {
                "staffDetails.name": {
                  $regex: req.query.name,
                  $options: "i",
                },
              }
            : {}),
        },
      },
      {
        $project: {
          staffDetails: {
            _id: "$staffDetails._id",
            name: "$staffDetails.name",
            designation: "$staffDetails.designation",
            salary: "$staffDetails.salary",
            taxPercentage: "$staffDetails.taxPercentage",
          },
          _id: 1,
          month: 1,
          year: 1,
          salary: 1,
          kidFee: 1,
          tax: 1,
          advance: 1,
          oldDue: 1,
          absentDays: 1,
          receivedAmount: 1,
        },
      },
      {
        $sort: {
          createdAt: dir,
        },
      },
    ]),

    options
  );
  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        "All salary sheets",
        makePaginatedResponse(salarySheet, dir)
      )
    );
});
const getSalarySheetById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid salary id"));
  }
  const salarySheet = await SalarySheet.findById(id).populate("staff");
  if (!salarySheet) {
    return res
      .status(404)
      .json(new GenericError(404, "Salary sheet not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Salary sheet found", salarySheet));
});
const updateSalarySheet = handleAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid salary id"));
  }

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

  const salary = staff.salary;
  const oneDaySalary = salary / totalWorkingDays;

  let absentDaySalary = 0;

  if (absentDays > 1) {
    absentDaySalary = oneDaySalary * absentDays - 1;
  }

  const salaryOfPresentDays = salary - absentDaySalary;

  const tax = (salary * staff.taxPercentage) / 100;
  const receivedAmount = salaryOfPresentDays - tax - kidFee - oldDue - advance;

  const updatedSalarySheet = await SalarySheet.findByIdAndUpdate(
    id,
    {
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
    },
    { new: true }
  );

  if (!updatedSalarySheet) {
    return res
      .status(404)
      .json(new GenericError(404, "Salary sheet not found"));
  }

  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        `Salary sheet updated for ${staff.name} in ${month}, ${year}`,
        updatedSalarySheet
      )
    );
});
const deleteSalarySheet = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid salary id"));
  }
  const salarySheet = await SalarySheet.findByIdAndDelete(id);
  if (!salarySheet) {
    return res
      .status(404)
      .json(new GenericError(404, "Salary sheet not found"));
  }

  return res
    .status(200)
    .json(new GenericReponse(200, "Salary sheet deleted", {}));
});

export {
  addSalarySheet,
  addSalarySheetBulk,
  deleteSalarySheet,
  getSalarySheetById,
  getSalarySheets,
  updateSalarySheet,
};
