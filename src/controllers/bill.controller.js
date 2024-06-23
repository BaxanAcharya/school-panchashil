import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { BILL_FEE_LIST } from "../constant.js";
import Bill from "../models/bill.model.js";
import billFeeModel from "../models/billFee.model.js";
import { Fee } from "../models/fee.model.js";
import { Student } from "../models/student.model.js";
import { TransportationArea } from "../models/transportation.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { uplaodOnBucket } from "../utils/bucket.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  convertToNepaliDate,
  getNepaliMonthName,
} from "../utils/nepaliDate.js";
import numberToWords from "../utils/numberToWord.js";
import { generatePDF } from "../utils/pdf.js";
import { validateMonth, validateYear } from "../validation/bill.validation.js";
const getString = (data) => {
  let rows = "";
  data.forEach((item, index) => {
    rows +=
      "<tr>\n" +
      "<td>" +
      (index + 1) +
      "</td>\n<td>" +
      item.note +
      "</td>\n<td>" +
      item.amount +
      "</td>\n<td></td>\n</tr>";
  });

  return rows;
};

const studentBillOfYearAndMonth = handleAsync(async (req, res) => {
  const { year, month, student } = req.params;
  const bills = await Bill.findOne({ year, month, "student.id": student })
    .populate("student.id", "fullName")
    .populate("student.class", "name");

  if (!bills) {
    return res
      .status(200)
      .json(new GenericReponse(200, "Bills not found", null));
  }

  return res
    .status(200)
    .json(new GenericReponse(200, "Bills Fetched Successfully", bills));
});

const addBill = handleAsync(async (req, res) => {
  const {
    student,
    month,
    year,
    isDeposit,
    isEvaluationTerm,
    isEvaluationTest,
    extra,
    isDiary,
    isIdentityCard,
    isStationaryFee,
    isServiceFee,
  } = req.body;

  if (!student) {
    return res.status(400).json(new GenericError(400, "Student is required"));
  }

  if (!mongoose.Types.ObjectId.isValid(student)) {
    return res.status(400).json(new GenericError(400, "Student is not valid"));
  }

  const isValidMonth = validateMonth(month);
  if (isValidMonth) {
    return res.status(400).json(new GenericError(400, isValidMonth));
  }
  const isValidYear = validateYear(year);
  if (isValidYear) {
    return res.status(400).json(new GenericError(400, isValidYear));
  }

  if (extra === null || extra === undefined) {
    return res.status(400).json(new GenericError(400, "Extra is required"));
  }
  if (typeof extra !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Extra should be a number"));
  }
  if (extra < 0) {
    return res
      .status(400)
      .json(new GenericError(400, "Extra should be a positive number"));
  }

  const isStudent = await Student.findById(student);
  if (!isStudent) {
    return res.status(400).json(new GenericError(400, "Student not found"));
  }

  if (isEvaluationTerm && isEvaluationTest) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          "Evaluation Term and Evaluation Test can't be applied together"
        )
      );
  }

  const isBill = await Bill.findOne({
    "student.id": student,
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

  //transportation
  let transportationFee = 0;
  if (isStudent.destination) {
    const transportationArea = await TransportationArea.findById(
      isStudent.destination
    );

    if (!transportationArea) {
      return res
        .status(400)
        .json(
          new GenericError(
            400,
            `Transportation area of student ${isStudent.fullName} not found`
          )
        );
    }

    const transportationFeeDiscount = isStudent.transportFeeDiscount || 0;

    if (transportationArea.amount < transportationFeeDiscount) {
      return res
        .status(400)
        .json(
          new GenericError(400, `Transportation fee is less than the discount`)
        );
    }
    transportationFee = transportationArea.amount;

    if (transportationFeeDiscount > 0 && transportationFee > 0) {
      transportationFee -= transportationFeeDiscount;
    }
  }

  //school fee
  let schoolFee = 0;
  const isFee = await Fee.findOne({
    class: isStudent.class,
  });
  if (!isFee) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee for this student class not found`));
  }

  const schoolFeeDiscount = isStudent.feeDiscount || 0;
  if (isFee.feeAmount < schoolFeeDiscount) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee is less than the discount`));
  }
  schoolFee = isFee.feeAmount;
  if (schoolFeeDiscount > 0 && schoolFee > 0) {
    schoolFee -= schoolFeeDiscount;
  }

  //admission Fee
  let admissionFee = 0;
  if (isStudent?.isNewStudent) {
    const admission = await billFeeModel.findOne({
      name: BILL_FEE_LIST[0],
    });
    if (admission) {
      const classList = admission.classes;
      if (classList.includes(isStudent.class)) {
        admissionFee = admission.amount;
      }
    }
    const admissionFeeDiscount = isStudent.admissionFeeDiscount || 0;
    if (admissionFeeDiscount > admissionFee) {
      return res
        .status(400)
        .json(new GenericError(400, `Admission fee is less than the discount`));
    }
    if (admissionFeeDiscount > 0 && admissionFee > 0) {
      admissionFee -= admissionFeeDiscount;
    }
  }

  //service Fee
  let serviceFee = 0;
  if (isServiceFee) {
    const service = await billFeeModel.findOne({
      name: BILL_FEE_LIST[1],
    });
    if (service) {
      const classList = service.classes;

      if (classList.includes(isStudent.class)) {
        serviceFee = service.amount;
      }
      const serviceFeeDiscount = isStudent.serviceFeeDiscount || 0;
      if (serviceFeeDiscount > serviceFee) {
        return res
          .status(400)
          .json(new GenericError(400, `Service fee is less than the discount`));
      }
      if (serviceFeeDiscount > 0 && serviceFee > 0) {
        serviceFee -= serviceFeeDiscount;
      }
    }
  }
  //stationary Fee
  let stationaryFee = 0;
  if (isStationaryFee) {
    const stationary = await billFeeModel.findOne({
      name: BILL_FEE_LIST[2],
      class: isStudent.class,
    });

    if (stationary) {
      if (stationary.amount < isStudent.stationaryFeeDiscount) {
        return res
          .status(400)
          .json(
            new GenericError(400, `Stationary fee is less than the discount`)
          );
      }
      stationaryFee = stationary.amount;
      const stationaryFeeDiscount = isStudent.stationaryFeeDiscount || 0;

      if (stationaryFeeDiscount > stationaryFee) {
        return res
          .status(400)
          .json(
            new GenericError(400, `Stationary fee is less than the discount`)
          );
      }

      if (isStudent.stationaryFeeDiscount > 0 && stationaryFee > 0) {
        stationaryFee -= isStudent.stationaryFeeDiscount;
      }
    }
  }

  //deposit
  let depositFee = 0;
  if (isDeposit) {
    const deposit = await billFeeModel.findOne({
      name: BILL_FEE_LIST[3],
    });

    if (deposit) {
      const classList = deposit.classes;
      if (classList.includes(isStudent.class)) {
        depositFee = deposit.amount;
      }
    }
  }

  //evaluation  || evaluation term
  let evaluationFee = 0;
  if (isEvaluationTerm) {
    const evaluation = await billFeeModel.findOne({
      name: BILL_FEE_LIST[4],
    });

    if (evaluation) {
      const classList = evaluation.classes;
      if (classList.includes(isStudent.class)) {
        evaluationFee = evaluation.amount;
      }
    }
  }
  //evaluation || evaluation test
  if (isEvaluationTest) {
    const evaluation = await billFeeModel.findOne({
      name: BILL_FEE_LIST[5],
    });

    if (evaluation) {
      const classList = evaluation.classes;
      if (classList.includes(isStudent.class)) {
        evaluationFee = evaluation.amount;
      }
    }
  }

  //diary
  let diaryFee = 0;
  if (isDiary) {
    const diary = await billFeeModel.findOne({
      name: BILL_FEE_LIST[6],
    });

    if (diary) {
      const classList = diary.classes;
      if (classList.includes(isStudent.class)) {
        diaryFee = diary.amount;
      }
    }
  }
  //identity card
  if (isIdentityCard) {
    const identityCard = await billFeeModel.findOne({
      name: BILL_FEE_LIST[7],
    });

    if (identityCard) {
      const classList = identityCard.classes;
      if (classList.includes(isStudent.class)) {
        diaryFee += identityCard.amount;
      }
    }
  }

  //due amount
  let dueAmount = 0;
  const unpaidBills = await Bill.findOne({
    "student.id": student,
  }).sort({ billNo: -1 });

  if (!unpaidBills) {
    dueAmount = isStudent?.dueAmount || 0;
  } else {
    dueAmount = unpaidBills.total - unpaidBills.paidAmount;
  }

  let total = 0;
  total += admissionFee;
  total += serviceFee;
  total += schoolFee;
  total += stationaryFee;
  total += depositFee;
  total += transportationFee;
  total += evaluationFee;
  total += extra || 0;
  total += dueAmount;
  total += diaryFee;

  const billToSave = {
    date: new Date(),
    student: {
      id: isStudent._id,
      class: isStudent.class,
      rollNo: isStudent.rollNumber,
    },
    month,
    year,
    admissionFee: {
      amount: admissionFee,
    },
    serviceFee: {
      amount: serviceFee,
    },
    schoolFee: {
      amount: schoolFee,
    },
    stationaryFee: {
      amount: stationaryFee,
    },
    deposit: {
      amount: depositFee,
    },

    transportation: {
      amount: transportationFee,
    },
    evaluation: {
      amount: evaluationFee,
    },
    extra: {
      amount: extra,
    },
    due: {
      amount: dueAmount,
    },
    diary: {
      amount: diaryFee,
    },
    url: null,
    isPaid: false,
    paidAmount: 0,
    total: total,
  };

  const lastBill = await Bill.findOne({}, {}, { sort: { _id: -1 } });

  let billNo = 1;
  if (lastBill) {
    billNo = lastBill.billNo + 1;
  }

  billToSave.billNo = billNo;

  isStudent.dueAmount = dueAmount;
  await isStudent.save();

  const bill = await Bill.create({
    ...billToSave,
  });

  return res
    .status(201)
    .json(new GenericReponse(201, "Bill Created Successfully", bill));
});

// const addBulkBill = handleAsync(async (req, res) => {
//   const { year, month } = req.params;
//   if (!Array.isArray(req.body)) {
//     return res
//       .status(400)
//       .json(new GenericError(400, "Body should be an array"));
//   }

//   const studentIds = req.body.map(({ id }) => {
//     return id;
//   });

//   if (!studentIds) {
//     return res
//       .status(400)
//       .json(new GenericError(400, "Student Ids are required"));
//   }

//   const students = await Student.find({ _id: { $in: studentIds } });
//   if (students.length != req.body.length) {
//     return res.status(404).json(new GenericError(404, "Students not found"));
//   }

//   const transporationFees = students.map((s) => {
//     if (s.destination) {
//       return s.destination;
//     }
//   });

//   const transportationAreas = await TransportationArea.find({
//     _id: { $in: transporationFees },
//   });

//   const availableBills = await Bill.find({
//     year,
//     month,
//     "student.id": { $in: studentIds },
//   });

//   const newBills = [];
//   const toUpdateBills = [];

//   const isFee = await Fee.findOne({
//     class: students[0].class,
//   });
//   if (!isFee) {
//     return res
//       .status(400)
//       .json(new GenericError(400, `Fee for the student class not found`));
//   }

//   const lastBill = await Bill.findOne({}, {}, { sort: { _id: -1 } });

//   let billNo = 1;
//   if (lastBill) {
//     billNo = lastBill.billNo + 1;
//   }

//   req.body.forEach(async (item) => {
//     const { id, data } = item;

//     const isAvaliable =
//       availableBills.find((bill) => {
//         return bill.student.id.toString() === id;
//       }) || null;

//     const student = students.find((student) => student._id.toString() == id);
//     let transportation = 0;
//     if (student.destination) {
//       var fees = transportationAreas.find(
//         (area) => area._id.toString() == student.destination
//       );
//       transportation = fees ? fees.amount : 0;
//       if (student.transportFeeDiscount > 0 && transportation > 0) {
//         transportation -= student.transportFeeDiscount;
//       }
//     }

//     let schoolFee = isFee.feeAmount || 0;
//     if (student.feeDiscount > 0 && schoolFee > 0) {
//       schoolFee -= student.feeDiscount;
//     }
//     if (isAvaliable) {
//       let total = 0;
//       isAvaliable.admissionFee.amount = data.admissionFee;
//       total += data.admissionFee;
//       isAvaliable.serviceFee.amount = data.serviceFee;
//       total += data.serviceFee;
//       isAvaliable.schoolFee.amount = schoolFee;
//       total += schoolFee;
//       isAvaliable.transportation.amount = transportation;
//       total += transportation;
//       isAvaliable.stationaryFee.amount = data.stationaryFee;
//       total += data.stationaryFee;
//       isAvaliable.deposit.amount = data.deposit;
//       total += data.deposit;
//       isAvaliable.evaluation.amount = data.evaluation;
//       total += data.evaluation;
//       isAvaliable.extra.amount = data.extra;
//       total += data.extra;
//       isAvaliable.due.amount = data.due;
//       total += data.due;
//       isAvaliable.diary.amount = data.diary;
//       total += data.diary;
//       isAvaliable.total = total;
//       isAvaliable.url = null;
//       isAvaliable.isPaid = data.isPaid;
//       toUpdateBills.push(isAvaliable);
//     } else {
//       const createBill = new Bill({
//         billNo: billNo,
//         date: new Date(),
//         student: {
//           id,
//           class: student.class,
//           rollNo: student.rollNumber,
//         },
//         month,
//         year,
//         admissionFee: {
//           amount: data.admissionFee,
//         },
//         serviceFee: {
//           amount: data.serviceFee,
//         },

//         schoolFee: {
//           amount: schoolFee,
//         },
//         stationaryFee: {
//           amount: data.stationaryFee,
//         },
//         deposit: {
//           amount: data.deposit,
//         },

//         transportation: {
//           amount: transportation,
//         },
//         evaluation: {
//           amount: data.evaluation,
//         },
//         extra: {
//           amount: data.extra,
//         },
//         due: {
//           amount: data.due,
//         },
//         diary: {
//           amount: data.diary,
//         },
//         url: null,
//         isPaid: data.isPaid,
//       });

//       createBill.total =
//         createBill.admissionFee.amount +
//         createBill.serviceFee.amount +
//         createBill.schoolFee.amount +
//         createBill.stationaryFee.amount +
//         createBill.deposit.amount +
//         createBill.transportation.amount +
//         createBill.evaluation.amount +
//         createBill.extra.amount +
//         createBill.due.amount +
//         createBill.diary.amount;
//       billNo++;
//       newBills.push(createBill);
//     }
//   });

//   try {
//     let savedBills = [];
//     if (newBills.length > 0) {
//       savedBills = await Bill.insertMany(newBills);
//     }
//     let updatedBills = [];

//     if (toUpdateBills.length > 0) {
//       updatedBills = await Promise.all(
//         toUpdateBills.map(async (bill) => {
//           return await Bill.findByIdAndUpdate(bill._id, {
//             ...bill,
//           });
//         })
//       );
//     }

//     return res

//       .status(201)
//       .json(
//         new GenericReponse(
//           201,
//           "Bills Created Successfully",
//           savedBills.concat(updatedBills)
//         )
//       );
//   } catch (error) {
//     return res.status(500).json(new GenericError(500, error?.messag));
//   }
// });

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
    schoolFee,
    stationaryFee,
    deposit,
    transportation,
    evaluation,
    extra,
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

  const isStudent = await Student.findById(isBill.student.id);
  if (!isStudent) {
    return res
      .status(400)
      .json(new GenericError(400, "Student not found For this bill"));
  }

  const toUpdate = {};
  if (admissionFee !== null && admissionFee !== undefined) {
    toUpdate.admissionFee = {
      amount: admissionFee,
    };
  } else {
    toUpdate.admissionFee = isBill.admissionFee;
  }
  if (serviceFee !== null && serviceFee !== undefined) {
    toUpdate.serviceFee = {
      amount: serviceFee,
    };
  } else {
    toUpdate.serviceFee = isBill.serviceFee;
  }

  if (schoolFee !== null && schoolFee !== undefined) {
    toUpdate.schoolFee = {
      amount: schoolFee,
    };
  } else {
    toUpdate.schoolFee = isBill.schoolFee;
  }
  if (stationaryFee !== null && stationaryFee !== undefined) {
    toUpdate.stationaryFee = {
      amount: stationaryFee,
    };
  } else {
    toUpdate.stationaryFee = isBill.stationaryFee;
  }
  if (deposit !== null && deposit !== undefined) {
    toUpdate.deposit = {
      amount: deposit,
    };
  } else {
    toUpdate.deposit = isBill.deposit;
  }

  if (transportation !== null && transportation !== undefined) {
    toUpdate.transportation = {
      amount: transportation,
    };
  } else {
    toUpdate.transportation = isBill.transportation;
  }

  if (evaluation !== null && evaluation !== undefined) {
    toUpdate.evaluation = {
      amount: evaluation,
      note: "Evaluation Fee (Yearly)",
    };
  } else {
    toUpdate.evaluation = isBill.evaluation;
  }
  if (extra !== null && extra !== undefined) {
    toUpdate.extra = {
      amount: extra,
    };
  } else {
    toUpdate.extra = isBill.extra;
  }

  if (diary !== null && diary !== undefined) {
    toUpdate.diary = {
      amount: diary,
    };
  } else {
    toUpdate.diary = isBill.diary;
  }

  toUpdate.total = 0;
  toUpdate.total +=
    admissionFee != !null && admissionFee !== undefined
      ? admissionFee
      : isBill.admissionFee.amount;
  toUpdate.total +=
    serviceFee !== null && serviceFee !== undefined
      ? serviceFee
      : isBill.serviceFee.amount;
  toUpdate.total +=
    schoolFee !== null && schoolFee !== undefined
      ? schoolFee
      : isBill.schoolFee.amount;
  toUpdate.total +=
    stationaryFee !== null && stationaryFee !== undefined
      ? stationaryFee
      : isBill.stationaryFee.amount;
  toUpdate.total +=
    deposit !== null && deposit !== undefined ? deposit : isBill.deposit.amount;
  toUpdate.total +=
    transportation != null && transportation !== undefined
      ? transportation
      : isBill.transportation.amount;
  toUpdate.total +=
    evaluation != null && evaluation !== undefined
      ? evaluation
      : isBill.evaluation.amount;
  toUpdate.total +=
    extra != null && extra !== undefined ? extra : isBill.extra.amount;
  toUpdate.total += isBill.due.amount;
  toUpdate.total +=
    diary != null && diary !== undefined ? diary : isBill.diary.amount;
  toUpdate.url = null;

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
  const isBill = await Bill.findById(id)
    .populate("student.id", "fullName")
    .populate("student.class", "name  section");

  if (!isBill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }

  if (isBill.url) {
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Printed Successfully", isBill.url));
  }

  const listOfFees = [];
  listOfFees.push(isBill.admissionFee);
  listOfFees.push(isBill.serviceFee);
  listOfFees.push(isBill.schoolFee);
  listOfFees.push(isBill.stationaryFee);
  listOfFees.push(isBill.deposit);
  listOfFees.push(isBill.transportation);
  listOfFees.push(isBill.evaluation);
  listOfFees.push(isBill.extra);
  listOfFees.push(isBill.due);
  listOfFees.push(isBill.diary);

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>School Bill</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border: 2px solid #000; /* Add black border */
        }

        h1 {
          text-align: center;
          color: #333;
        }

        .student-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .student-info p {
          margin: 5px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          border: 1px solid black;
        }

        th,
        td {
          padding: 8px;
          text-align: left;
          border: 1px solid black;

        }

        .total {
          margin-top: 20px;
          text-align: right;
        }

        .footer {
          margin-top: 20px;
          text-align: center;
          color: #010000;
        }

        .monthly-bill-info {
          border-top: 2px solid #000;
          margin-top: 20px;
          padding-top: 20px;
        }

        .monthly-bill-info h2 {
          text-align: center;
          font-weight: bold;
          text-decoration: underline;
        }

        .monthly-bill-info p {
          text-align: center;
        }

        .bill-date {
          text-align: right;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img
          src="https://panchashil.s3.amazonaws.com/logo/logo-rectangle.png"
          width="100%"
          height="100px"
          style="object-fit: contain"
          alt="School Rectangle Logo"
        />
        ${
          isBill.isPaid
            ? `<h1 style="text-align: center;">Cash Bill</h1>`
            : `<h1 style="text-align: center;">Information Bill</h1>`
        }
        ${
          isBill.isPaid
            ? `<p style="text-align: center">
          Bill Number:
          <span style="font-weight: bold"
            >#${isBill.billNo}</span
          >
        </p>`
            : ""
        }

        <div class="student-info">
          <div>
            <p><strong>Student Name:</strong> ${isBill.student.id.fullName}</p>
            <p><strong>Roll No:</strong>${isBill.student.rollNo}</p>
            <p><strong>Month:</strong> ${getNepaliMonthName(isBill.month)}</p>
          </div>
          <div>
            <p>
              <strong>Class:</strong> ${isBill.student.class.name} ${
                isBill.student.class.section
              }
            </p>
            <p>
             <strong> Date:</strong> ${convertToNepaliDate(isBill.date)}
            </p>
            <p><strong>Year:</strong> ${isBill.year}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.N</th>
              <th>Descriptions</th>
              <th>Amount (Rs)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
          ${getString(listOfFees)}
          </tbody>
        </table>
     <div style="display:flex;justify-content: flex-end;"> 
        <div class="total">
          <p><strong>Total :</strong> Rs ${isBill.total}</p>
        </div>
        
      ${
        isBill.isPaid
          ? ` <div class="total" style="margin-left:20px">
          <p><strong>Paid :</strong> Rs ${isBill.paidAmount}</p>
        </div>`
          : ``
      }
      </div>
      ${
        !isBill.isPaid
          ? ` <div>
          <p>
            <strong>Total Amount in words:</strong> ${numberToWords(
              isBill.total
            )}
            Only
          </p>
        </div>`
          : ""
      }
       
        ${
          isBill.isPaid
            ? `<div>
          <p>
            <strong>Total Paid Amount in words:</strong> ${numberToWords(
              isBill.paidAmount
            )}
            Only
          </p>  
        </div>`
            : ``
        }
           
        <div class="footer">
          <p>
            Note: Monthly fee should be paid within ten days from the starting of
            every month.
          </p>
          <p>
            For any queries, please contact the school office Number. (9855041017)
          </p>
        </div>
        <div style="display: flex; align-items: center; justify-content: center">
        <p>Signature:</p>
        <span style="margin-top: 7px; margin-left: 5px; font-weight: bold">
          ---------------------------</span
        >
      </div>
      </div>
    </body>
  </html> `;

  generatePDF(html, `${id}.pdf`)
    .then(async () => {
      const __dirname = fileURLToPath(import.meta.url);
      const filePath = path.join(__dirname, `../../../public/temp/${id}.pdf`);
      const pathUrl = await uplaodOnBucket(filePath);
      isBill.url = pathUrl;
      await isBill.save();
      res
        .status(200)
        .json(new GenericReponse(200, "Bill Printed Successfully", isBill.url));
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          new GenericError(500, err.message || "Error while printing bill")
        );
    });
});

const getBillsOfStudentIn = handleAsync(async (req, res) => {
  const { year, month } = req.params;
  const { studentIds } = req.query;
  if (!studentIds) {
    return res
      .status(400)
      .json(new GenericError(400, "Student Ids are required"));
  }

  let studentsIncoming = [];
  if (Array.isArray(studentIds)) {
    studentsIncoming = studentIds;
  } else {
    studentsIncoming = studentIds.split(",");
  }

  if (!Array.isArray(studentsIncoming)) {
    return res
      .status(400)
      .json(new GenericError(400, "Student ids should be an array"));
  }

  const students = [];
  studentsIncoming.forEach((id) => {
    const s = students.find((s) => {
      return s.toString() === id;
    });
    if (!s) {
      students.push(id);
    }
  });
  const studentRes = await Student.find({ _id: { $in: students } });
  if (students.length != studentRes.length) {
    return res.status(404).json(new GenericError(404, "Students not found"));
  }
  const classes = [];

  studentRes.forEach((student) => {
    const c = classes.find((c) => {
      return c.toString() === student.class.toString();
    });
    if (!c) {
      classes.push(student.class);
    }
  });
  if (classes.length > 1) {
    return res
      .status(400)
      .json(new GenericError(400, "Students should be of same class"));
  }

  const isFee = await Fee.findOne({
    class: classes[0],
  }).populate("class", "name");
  if (!isFee) {
    return res
      .status(404)
      .json(new GenericError(404, `Fee not found for this class`));
  }

  const bills = await Bill.find({
    "student.id": { $in: students },
    year,
    month,
  });

  const billFee = await billFeeModel.find();

  const transportations = [];
  studentRes.forEach((student) => {
    if (!student.destination) return;
    const t = transportations.find((t) => {
      return t.toString() === student.destination.toString();
    });
    if (!t) {
      transportations.push(student.destination);
    }
  });

  const transportationFees = await TransportationArea.find({
    _id: { $in: transportations },
  });

  return res.json({
    students: studentRes,
    bills,
    billFee,
    transportationFees,
  });
});

const payBill = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { paidAmount } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Bill Id"));
  }
  const isBill = await Bill.findById(id);
  if (!isBill) {
    return res.status(404).json(new GenericError(404, "Bill not found"));
  }
  if (isBill.isPaid) {
    return res.status(400).json(new GenericError(400, "Bill already paid"));
  }

  if (paidAmount > isBill.total) {
    return res
      .status(400)
      .json(
        new GenericError(400, "Paid amount is greater than the total amount")
      );
  }
  const isStudent = await Student.findById(isBill.student.id);
  if (!isStudent) {
    return res
      .status(404)
      .json(new GenericError(404, "Student not found for this bill"));
  }

  isStudent.dueAmount = isBill.total - paidAmount;
  await isStudent.save();

  isBill.isPaid = true;
  isBill.paidAmount = paidAmount;
  isBill.url = null;

  await isBill.save();

  return res
    .status(200)
    .json(new GenericReponse(200, "Bill Paid Successfully", isBill));
});

export {
  addBill,
  deleteBill,
  getBill,
  getBills,
  getBillsOfStudentIn,
  payBill,
  printBill,
  studentBillOfYearAndMonth,
  updateBill,
};
