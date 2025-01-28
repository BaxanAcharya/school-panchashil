import mongoose from "mongoose";
import { BILL_FEE_LIST } from "../constant.js";
import Bill from "../models/bill.model.js";
import billFeeModel from "../models/billFee.model.js";
import { Fee } from "../models/fee.model.js";
import { Student } from "../models/student.model.js";
import { TransportationArea } from "../models/transportation.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  handlePaginationParams,
  makePaginatedResponse,
} from "../utils/HandlePagination.js";
import {
  convertToNepaliDate,
  getNepaliMonthName,
} from "../utils/nepaliDate.js";
import numberToWords from "../utils/numberToWord.js";
import { validateMonth, validateYear } from "../validation/bill.validation.js";
const getString = (data) => {
  let rows = "";
  data.forEach((item, index) => {
    rows +=
      "<tr style='font-weight:bold;'>\n" +
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
    .populate("student.class", "name, section");

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
    dueAmount =
      unpaidBills.total - unpaidBills.paidAmount - unpaidBills.discount;
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

const getBills = handleAsync(async (req, res) => {
  const { options, dir } = handlePaginationParams(req);
  const billAggregate = [
    {
      $match: {
        ...(req.query.isPaid !== undefined
          ? { isPaid: req.query.isPaid === "true" } // Converts string to boolean
          : {}),
        ...(req.query.studentId
          ? { "student.id": new mongoose.Types.ObjectId(req.query.studentId) }
          : {}),
        ...(req.query.classId
          ? { "student.class": new mongoose.Types.ObjectId(req.query.classId) }
          : {}),
        ...(req.query.year ? { year: parseInt(req.query.year) } : {}),
        ...(req.query.month ? { month: parseInt(req.query.month) } : {}),
      },
    },
    {
      $lookup: {
        from: "students", // Name of the students collection
        localField: "student.id",
        foreignField: "_id",
        as: "studentDetails",
      },
    },
    {
      $lookup: {
        from: "classes", // Name of the classes collection
        localField: "student.class",
        foreignField: "_id",
        as: "classDetails",
      },
    },
    {
      $unwind: {
        path: "$studentDetails",
        preserveNullAndEmptyArrays: true, // Allow for empty or null matches
      },
    },
    {
      $unwind: {
        path: "$classDetails",
        preserveNullAndEmptyArrays: true, // Allow for empty or null matches
      },
    },
    {
      $match: {
        ...(req.query.name
          ? {
              "studentDetails.fullName": {
                $regex: req.query.name,
                $options: "i",
              },
            }
          : {}),
      },
    },
    {
      $project: {
        "student.id": {
          _id: "$studentDetails._id",
          fullName: "$studentDetails.fullName",
        },
        "student.class": {
          _id: "$classDetails._id",
          name: "$classDetails.name",
          section: "$classDetails.section",
        },
        "student.rollNo": 1,
        admissionFee: 1,
        serviceFee: 1,
        schoolFee: 1,
        stationaryFee: 1,
        deposit: 1,
        transportation: 1,
        evaluation: 1,
        extra: 1,
        due: 1,
        diary: 1,
        _id: 1,
        billNo: 1,
        date: 1,
        month: 1,
        year: 1,
        total: 1,
        url: 1,
        isPaid: 1,
        paidAmount: 1,
        createdAt: 1,
        updatedAt: 1,
        discount: 1,
      },
    },
    {
      $sort: {
        billNo: dir,
      },
    },
  ];

  const totalSumsPipeline = [
    ...billAggregate,
    {
      $group: {
        _id: null,
        admissionFeeSum: { $sum: "$admissionFee.amount" },
        serviceFeeSum: { $sum: "$serviceFee.amount" },
        schoolFeeSum: { $sum: "$schoolFee.amount" },
        stationaryFeeSum: { $sum: "$stationaryFee.amount" },
        depositSum: { $sum: "$deposit.amount" },
        transportationSum: { $sum: "$transportation.amount" },
        evaluationSum: { $sum: "$evaluation.amount" },
        extraSum: { $sum: "$extra.amount" },
        diarySum: { $sum: "$diary.amount" },
        paidAmountSum: { $sum: "$paidAmount" },
        discountSum: { $sum: "$discount" },
        totalSum: {
          $sum: {
            $add: [
              "$admissionFee.amount",
              "$serviceFee.amount",
              "$schoolFee.amount",
              "$stationaryFee.amount",
              "$deposit.amount",
              "$transportation.amount",
              "$evaluation.amount",
              "$extra.amount",
              "$diary.amount",
            ],
          },
        },
      },
    },
  ];

  const [totals] = await Bill.aggregate(totalSumsPipeline);

  const paginatedResult = await Bill.aggregatePaginate(
    Bill.aggregate(billAggregate),
    options
  );

  if (!paginatedResult) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching bills"));
  }

  return res.status(200).json(
    new GenericReponse(200, "Bills Fetched Successfully", {
      ...makePaginatedResponse(paginatedResult, dir),
      totals: {
        totalSum: totals?.totalSum || 0,
        paidAmountSum: totals?.paidAmountSum || 0,
        discountSum: totals?.discountSum || 0,
        totalUnpaid:
          totals?.totalSum - (totals?.paidAmountSum + totals?.discountSum) || 0,
      },
    })
  );
});

const getBillOfClassYearMonth = handleAsync(async (req, res) => {
  const { class: classId, year, month } = req.params;
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new GenericError(400, "Invalid Class Id"));
  }

  const bills = await Bill.find({ "student.class": classId, year, month })
    .populate("student.id", "fullName")
    .populate("student.class", "name section");

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
    .populate("student.class", "name section");

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

const bulkPrintBill = handleAsync(async (req, res) => {
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

  const bills = await Bill.find({
    "student.id": { $in: students },
    year,
    month,
  })
    .populate("student.id", "fullName")
    .populate("student.class", "name  section");

  const content = bills
    .map((isBill) => {
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

      return `
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
              ? `<h1 style="text-align: center; margin-top:-10px">Cash Bill</h1>`
              : `<h1 style="text-align: center; margin-top:-10px">Information Bill</h1>`
          }
          ${
            isBill.isPaid
              ? `<p style="text-align: center; margin-top:-25px; font-weight: bold">
            Bill Number:
            <span style="font-weight: bold">#${isBill.billNo}</span>
          </p>`
              : ""
          }
          <div class="student-info" style="margin-top:-20px !important">
            <div>
              <p>
                <strong>Student Name: ${isBill.student.id.fullName}
            </strong> </p>
              <p>
                <strong>Roll No: ${isBill.student.rollNo}
          </strong>    </p>
              <p>
                <strong>Month: ${getNepaliMonthName(isBill.month)}
            </strong>  </p>
            </div>
            <div>
              <p>
                <strong>Class: ${isBill.student.class.name} ${
                  isBill.student.class.section
                }
             </strong> </p>
              <p>
                <strong>Date:${convertToNepaliDate(isBill.date)}
            </strong>   </p>
              <p>
                <strong>Year:${isBill.year}
            </strong>   </p>
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
            <tbody>${getString(listOfFees)}</tbody>
          </table>
          <div style="display:flex;justify-content: flex-end;">
            <div class="total">
              <p><strong>Total : Rs ${isBill.total} </strong></p>
            </div>
            ${
              isBill.discount && isBill.isPaid
                ? `<div class="total" style="margin-left:20px">
                  <p><strong>Discount : Rs ${isBill.discount} </strong></p>
                </div>`
                : ""
            }
            ${
              isBill.isPaid
                ? `<div class="total" style="margin-left:20px">
                  <p><strong>Paid : Rs ${isBill.paidAmount}</strong></p>
                </div>`
                : ""
            }
          </div>
          ${
            !isBill.isPaid
              ? `<div>
                <p>
                  <strong>Total Amount in words: ${numberToWords(
                    isBill.total
                  )} Only
               </strong> </p>
              </div>`
              : ""
          }
          ${
            isBill.isPaid
              ? `<div>
                <p>
                  <strong>Total Paid Amount in words:${numberToWords(
                    isBill.paidAmount
                  )} Only
              </strong></p>  
              </div>`
              : ""
          }
          <div class="footer">
            <p style='font-weight:bold;'>Note: Monthly fee should be paid within ten days from the starting of every month.</p>
            <p style='font-weight:bold;'>For any queries, please contact the school office Number. (9855041017)</p>
          </div>
        </div>
      `;
    })
    .join("");

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
            margin-top: 10px;
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
      ${content}
      </body>
    </html> `;

  res
    .status(200)
    .json(new GenericReponse(200, "Bills Fetched Successfully", html));
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
          margin-top: 10px;
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
            ? `<h1 style="text-align: center; margin-top:-10px">Cash Bill</h1>`
            : `<h1 style="text-align: center; margin-top:-10px">Information Bill</h1>`
        }
        ${
          isBill.isPaid
            ? `<p style="text-align: center; margin-top:-25px; font-weight: bold">
          Bill Number:
          <span style="font-weight: bold"
            >#${isBill.billNo}</span
          >
        </p>`
            : ""
        }

        <div class="student-info" style="margin-top:-20px !important">
          <div>
            <p><strong>Student Name: ${
              isBill.student.id?.fullName
                ? isBill.student.id?.fullName
                : "Student"
            } </strong></p>
            <p><strong>Roll No:${isBill.student.rollNo}</strong></p>
            <p><strong>Month: ${getNepaliMonthName(isBill.month)}</strong></p>
          </div>
          <div>
            <p>
              <strong>Class: ${isBill.student.class.name} ${
                isBill.student.class.section
              }
              </strong>
            </p>
            <p>
             <strong> Date: ${convertToNepaliDate(isBill.date)}
             </strong>
            </p>
            <p><strong>Year: ${isBill.year}
            </strong></p>
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
          <p><strong>Total : Rs ${isBill.total} </strong></p>
        </div>

        ${
          isBill.discount && isBill.isPaid
            ? `  <div class="total" style="margin-left:20px">
        <p><strong>Discount : Rs ${isBill.discount}</strong></p>
      </div>`
            : ""
        }

      
        
      ${
        isBill.isPaid
          ? ` <div class="total" style="margin-left:20px">
          <p><strong>Paid : Rs ${isBill.paidAmount}</strong></p>
        </div>`
          : ``
      }
      </div>
      ${
        !isBill.isPaid
          ? ` <div>
          <p>
            <strong>Total Amount in words: ${numberToWords(isBill.total)}
            Only
        </strong> </p>
        </div>`
          : ""
      }
       
        ${
          isBill.isPaid
            ? `<div>
          <p>
            <strong>Total Paid Amount in words: ${numberToWords(
              isBill.paidAmount
            )}
            Only
         </strong> </p>  
        </div>`
            : ``
        }
           
        <div class="footer">
          <p style='font-weight:bold;'>
            Note: Monthly fee should be paid within ten days from the starting of
            every month.
          </p>
          <p style='font-weight:bold;'>
            For any queries, please contact the school office Number. (9855041017)
          </p>
        </div>
        
      </div>
    </body>
  </html> `;

  return res.status(200).json(new GenericReponse(200, "Bill Created", html));
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

  const lastBills = await Promise.all(
    studentRes.map(async (student) => {
      return await Bill.findOne({ "student.id": student._id }).sort({
        createdAt: -1,
      });
    })
  );
  const validLastBills = lastBills.filter((bill) => bill !== null);
  studentRes.forEach((student) => {
    const bill = validLastBills.find((b) => {
      return b.student.id.toString() === student._id.toString();
    });
    if (bill && !bill.isPaid) {
      student.dueAmount = bill.total - bill.paidAmount - bill.discount;
    }
  });

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

  return res.status(200).json(
    new GenericReponse(200, "Bills Fetched Successfully", {
      students: studentRes,
      bills,
      billFee,
      transportationFees,
      classFee: isFee,
    })
  );
});

const payBill = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, discount } = req.body;
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

  isStudent.dueAmount = isBill.total - paidAmount - discount;
  await isStudent.save();

  isBill.isPaid = true;
  isBill.discount = discount;
  isBill.paidAmount = paidAmount;
  isBill.url = null;

  await isBill.save();

  return res
    .status(200)
    .json(new GenericReponse(200, "Bill Paid Successfully", isBill));
});

const addBulkBill = handleAsync(async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res
      .status(400)
      .json(new GenericError(400, "Body should be an array"));
  }

  if (req.body.length === 0) {
    return res
      .status(400)
      .json(new GenericError(400, "Body should not be empty"));
  }

  req.body.forEach(async (item) => {
    const {
      student,
      admissionFee,
      serviceFee,
      schoolFee,
      stationaryFee,
      deposit,
      transportation,
      evaluation,
      extra,
      diary,
    } = item;

    if (!student) {
      return res.status(400).json(new GenericError(400, "Student is required"));
    }
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json(new GenericError(400, "Invalid Student Id"));
    }
    if (admissionFee === null || admissionFee === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Admission Fee is required"));
    }
    if (typeof admissionFee !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Admission Fee should be a number"));
    }
    if (serviceFee === null || serviceFee === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Service Fee is required"));
    }
    if (typeof serviceFee !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Service Fee should be a number"));
    }
    if (schoolFee === null || schoolFee === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "School Fee is required"));
    }
    if (typeof schoolFee !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "School Fee should be a number"));
    }
    if (stationaryFee === null || stationaryFee === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Stationary Fee is required"));
    }
    if (typeof stationaryFee !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Stationary Fee should be a number"));
    }
    if (deposit === null || deposit === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Deposit Fee is required"));
    }
    if (typeof deposit !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Deposit Fee should be a number"));
    }
    if (transportation === null || transportation === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Transportation Fee is required"));
    }
    if (typeof transportation !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Transportation Fee should be a number"));
    }
    if (evaluation === null || evaluation === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Evaluation Fee is required"));
    }
    if (typeof evaluation !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Evaluation Fee should be a number"));
    }
    if (extra === null || extra === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Extra Fee is required"));
    }
    if (typeof extra !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Extra Fee should be a number"));
    }
    if (diary === null || diary === undefined) {
      return res
        .status(400)
        .json(new GenericError(400, "Diary Fee is required"));
    }
    if (typeof diary !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Diary Fee should be a number"));
    }
  });

  const cleanStudentsObject = [];
  const cleanStudents = [];
  req.body.forEach((item) => {
    const s = cleanStudentsObject.find(
      (s) => s.toString() === item.student.toString()
    );
    if (!s) {
      cleanStudentsObject.push(item);
      cleanStudents.push(item.student);
    }
  });

  if (cleanStudents.length !== req.body.length) {
    return res
      .status(400)
      .json(new GenericError(400, "Students should be unique"));
  }

  const students = await Student.find({ _id: { $in: cleanStudents } });
  if (students.length !== cleanStudents.length) {
    return res.status(404).json(new GenericError(404, "Students not found"));
  }
  const { year, month } = req.params;
  const bills = await Bill.find({
    year,
    month,
    "student.id": { $in: cleanStudents },
  });

  const lastBill = await Bill.findOne({}, {}, { sort: { _id: -1 } });
  let billNo = 1;
  if (lastBill) {
    billNo = lastBill.billNo + 1;
  }
  const newBills = [];
  const newDueStudents = [];
  cleanStudentsObject.forEach(async (student) => {
    const isAvaliable = bills.find((bill) => {
      return bill.student.id.toString() === student.student.toString();
    });
    if (!isAvaliable) {
      const isStudent = students.find(
        (s) => s._id.toString() === student.student.toString()
      );
      if (student) {
        let obj = {
          billNo,
          date: new Date(),
          student: {
            id: isStudent._id,
            class: isStudent.class,
            rollNo: isStudent.rollNumber,
          },
          month,
          year,
          admissionFee: {
            amount: student.admissionFee,
          },
          serviceFee: {
            amount: student.serviceFee,
          },
          schoolFee: {
            amount: student.schoolFee,
          },
          stationaryFee: {
            amount: student.stationaryFee,
          },
          deposit: {
            amount: student.deposit,
          },
          transportation: {
            amount: student.transportation,
          },
          evaluation: {
            amount: student.evaluation,
          },
          extra: {
            amount: student.extra,
          },
          due: {
            amount: student.due,
          },
          diary: {
            amount: student.diary,
          },
          url: null,
          isPaid: false,
          paidAmount: 0,
        };
        obj.total =
          obj.admissionFee.amount +
          obj.serviceFee.amount +
          obj.schoolFee.amount +
          obj.stationaryFee.amount +
          obj.deposit.amount +
          obj.transportation.amount +
          obj.evaluation.amount +
          obj.extra.amount +
          obj.due.amount +
          obj.diary.amount;

        billNo++;

        newBills.push(obj);
        isStudent.dueAmount = obj.due.amount;
        newDueStudents.push(isStudent);
      }
    }
  });

  try {
    const savedBills = await Bill.insertMany(newBills);
    await Promise.all(
      newDueStudents.map(async (student) => {
        return await Student.findByIdAndUpdate(student._id, student);
      })
    );
    return res
      .status(201)
      .json(
        new GenericReponse(
          201,
          "Bills Created Successfully",
          savedBills.concat(bills)
        )
      );
  } catch (error) {
    return res.status(500).json(new GenericError(500, error?.message));
  }
});

export {
  addBill,
  addBulkBill,
  bulkPrintBill,
  deleteBill,
  getBill,
  getBillOfClassYearMonth,
  getBills,
  getBillsOfStudentIn,
  payBill,
  printBill,
  studentBillOfYearAndMonth,
  updateBill,
};
