import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import { Fee } from "../models/fee.model.js";
import { Student } from "../models/student.model.js";
import { TransportationFee } from "../models/transportationFee.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  validateMonth,
  validateStudent,
  validateYear,
} from "../validation/bill.validation.js";

const addBill = handleAsync(async (req, res) => {
  const {
    student,
    month,
    year,
    admissionFee,
    serviceFee,
    stationaryFee,
    deposit,
    snack,
    evaluation,
    care,
    due,
    diary,
  } = req.body;

  const isValidStudent = validateStudent(student);
  if (isValidStudent) {
    return res.status(400).json(new GenericError(400, isValidStudent));
  }
  const isValidMonth = validateMonth(month);
  if (isValidMonth) {
    return res.status(400).json(new GenericError(400, isValidMonth));
  }
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }
  const { id, class: classId } = student;
  const isStudent = await Student.findById(id);
  if (!isStudent) {
    return res.status(400).json(new GenericError(400, "Student not found"));
  }

  let transportation = 0;

  if (isStudent.vechileRoute) {
    const transportationFee = TransportationFee.findById(student.vechileRoute);
    if (!transportationFee) {
      return res
        .status(400)
        .json(
          new GenericError(
            400,
            `Transportation fee for student ${isStudent.fullName} not found`
          )
        );
    }
    transportation = transportationFee.fee;
  }

  const isFee = await Fee.findOne({
    class: classId,
  });
  if (!isFee) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee for class ${classId} not found`));
  }

  const isBill = await Bill.findOne({
    "student.id": student.id,
    month,
    year,
  });
  if (isBill) {
    return res
      .status(409)
      .json(
        new GenericError(
          409,
          `Bill of student ${isStudent.fullName} for month ${month} and year ${year} already exists`
        )
      );
  }

  const billToSave = {
    date: new Date(),
    student: {
      id,
      class: classId,
      rollNo: isStudent.rollNumber,
    },
    month,
    year,
    admissionFee: {
      amount: admissionFee || 0,
      note: "Admission Fee (Yearly for new student only)",
    },
    serviceFee: {
      amount: serviceFee || 0,
      note: "Project/Sport/First Aid/Extra Curricular Fee (Yearly)",
    },
    schoolFee: {
      amount: isFee.feeAmount || 0,
      note: "School Fee (Monthly)",
    },
    stationaryFee: {
      amount: stationaryFee || 0,
      note: "Stationary Fee (Monthly)",
    },
    deposit: {
      amount: deposit || 0,
      note: "Deposit (Refundable)",
    },
    snack: {
      amount: snack || 0,
      note: "Snack (Monthly)",
    },
    transportation: {
      amount: transportation || 0,
      note: "Transportation Fee (Monthly)",
    },
    evaluation: {
      amount: evaluation || 0,
      note: "Evaluation Fee (Yearly)",
    },
    care: {
      amount: care || 0,
      note: "Care Fee (Monthly)",
    },

    due: {
      amount: due || 0,
      note: "Due Fee (Monthly)",
    },
    diary: {
      amount: diary || 0,
      note: "Diary Fee (Yearly)",
    },
  };

  let total = 0;
  total += admissionFee || 0;
  total += serviceFee || 0;
  total += isFee.feeAmount || 0;
  total += stationaryFee || 0;
  total += deposit || 0;
  total += snack || 0;
  total += transportation;
  total += evaluation || 0;
  total += care || 0;
  total += due || 0;
  total += diary || 0;

  billToSave.total = total;
  const lastBill = await Bill.findOne({}, {}, { sort: { _id: -1 } });

  let billNo = 1;
  if (lastBill) {
    billNo = lastBill.billNo + 1;
  }

  billToSave.billNo = billNo;

  const bill = await Bill.create({
    ...billToSave,
  });

  return res
    .status(201)
    .json(new GenericReponse(201, "Bill Created Successfully", bill));
});

const getBills = handleAsync(async (req, res) => {
  const query = {};
  const { studentId } = req.query;
  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json(new GenericError(400, "Invalid Student Id"));
    }
    query["student.id"] = studentId;
  }
  const { classId } = req.query;
  if (classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json(new GenericError(400, "Invalid Class Id"));
    }
    query["student.class"] = classId;
  }
  const { year } = req.query;
  if (year) {
    query.year = year;
  }
  const { month } = req.query;
  if (month) {
    query.month = month;
  }

  const bills = await Bill.find(query)
    .populate("student.id", "fullName")
    .populate("student.class", "name");

  return res
    .status(200)
    .json(new GenericReponse(200, "Bills Fetched Successfully", bills));
});
const getBill = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Bill Id"));
  }

  const bill = await Bill.findById(id)
    .populate("student.id", "fullName")
    .populate("student.class", "name");

  if (!bill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }

  return res
    .status(200)
    .json(new GenericReponse(200, "Bill Fetched Successfully", bill));
});
const updateBill = handleAsync(async (req, res) => {
  const {
    admissionFee,
    serviceFee,
    stationaryFee,
    deposit,
    snack,
    evaluation,
    care,
    due,
    diary,
  } = req.body;

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Bill Id"));
  }

  const isBill = await Bill.findById(id);
  if (!isBill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }
  const toUpdate = {};
  if (admissionFee) {
    toUpdate.admissionFee = {
      amount: admissionFee,
      note: "Admission Fee (Yearly for new student only)",
    };
  }
  if (serviceFee) {
    toUpdate.serviceFee = {
      amount: serviceFee,
      note: "Project/Sport/First Aid/Extra Curricular Fee (Yearly)",
    };
  }
  if (stationaryFee) {
    toUpdate.stationaryFee = {
      amount: stationaryFee,
      note: "Stationary Fee (Monthly)",
    };
  }
  if (deposit) {
    toUpdate.deposit = {
      amount: deposit,
      note: "Deposit (Refundable)",
    };
  }
  if (snack) {
    toUpdate.snack = {
      amount: snack,
      note: "Snack (Monthly)",
    };
  }
  if (evaluation) {
    toUpdate.evaluation = {
      amount: evaluation,
      note: "Evaluation Fee (Yearly)",
    };
  }
  if (care) {
    toUpdate.care = {
      amount: care,
      note: "Care Fee (Monthly)",
    };
  }
  if (due) {
    toUpdate.due = {
      amount: due,
      note: "Due Fee (Monthly)",
    };
  }
  if (diary) {
    toUpdate.diary = {
      amount: diary,
      note: "Diary Fee (Yearly)",
    };
  }

  toUpdate.total = 0;
  toUpdate.total += admissionFee || isBill.admissionFee.amount;
  toUpdate.total += serviceFee || isBill.serviceFee.amount;
  toUpdate.total += isBill.schoolFee.amount;
  toUpdate.total += stationaryFee || isBill.stationaryFee.amount;
  toUpdate.total += deposit || isBill.deposit.amount;
  toUpdate.total += snack || isBill.snack.amount;
  toUpdate.total += isBill.transportation.amount;
  toUpdate.total += evaluation || isBill.evaluation.amount;
  toUpdate.total += care || isBill.care.amount;
  toUpdate.total += due || isBill.due.amount;
  toUpdate.total += diary || isBill.diary.amount;

  const updatedBill = await Bill.findByIdAndUpdate(
    id,
    {
      ...toUpdate,
    },
    {
      new: true,
    }
  )
    .populate("student.id", "fullName")
    .populate("student.class", "name");

  return res
    .status(200)
    .json(new GenericReponse(200, "Bill Updated Successfully", updatedBill));
});
const deleteBill = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Bill Id"));
  }

  const bill = await Bill.findByIdAndDelete(id);

  if (!bill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }

  return res
    .status(200)
    .json(new GenericReponse(200, "Bill Deleted Successfully", {}));
});
const printBill = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Bill Id"));
  }
  const isBill = await Bill.findById(id);
  if (!isBill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }
  res.status(200).json(
    new GenericReponse(200, "Bill Printed Successfully", {
      todo: "Is to implement",
    })
  );
  //:Todo
});
export { addBill, deleteBill, getBill, getBills, printBill, updateBill };
