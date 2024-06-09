import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Bill from "../models/bill.model.js";
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
import {
  validateMonth,
  validateStudent,
  validateYear,
} from "../validation/bill.validation.js";
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

const addBill = handleAsync(async (req, res) => {
  const {
    student,
    month,
    year,
    admissionFee,
    serviceFee,
    stationaryFee,
    deposit,
    evaluation,
    extra,
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
    transportation = transportationArea.amount;
    if (isStudent.transportFeeDiscount > 0 && transportation > 0) {
      transportation -= isStudent.transportFeeDiscount;
    }
  }

  const isFee = await Fee.findOne({
    class: classId,
  });
  if (!isFee) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee for this student class not found`));
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

  let schoolFee = isFee.feeAmount || 0;
  if (isStudent.feeDiscount > 0 && schoolFee > 0) {
    schoolFee -= isStudent.feeDiscount;
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
    },
    serviceFee: {
      amount: serviceFee || 0,
    },
    schoolFee: {
      amount: schoolFee || 0,
    },
    stationaryFee: {
      amount: stationaryFee || 0,
    },
    deposit: {
      amount: deposit || 0,
    },

    transportation: {
      amount: transportation || 0,
    },
    evaluation: {
      amount: evaluation || 0,
    },
    extra: {
      extra: extra || 0,
    },

    due: {
      amount: due || 0,
    },
    diary: {
      amount: diary || 0,
    },
  };

  let total = 0;
  total += admissionFee || 0;
  total += serviceFee || 0;
  total += schoolFee || 0;
  total += stationaryFee || 0;
  total += deposit || 0;
  total += transportation;

  total += evaluation || 0;
  total += extra || 0;
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

const addBulkBill = handleAsync(async (req, res) => {
  const { year, month } = req.params;
  if (!Array.isArray(req.body)) {
    return res
      .status(400)
      .json(new GenericError(400, "Body should be an array"));
  }

  const studentIds = req.body.map(({ id }) => {
    return id;
  });

  if (!studentIds) {
    return res
      .status(400)
      .json(new GenericError(400, "Student Ids are required"));
  }

  const students = await Student.find({ _id: { $in: studentIds } });
  if (students.length != req.body.length) {
    return res.status(404).json(new GenericError(404, "Students not found"));
  }

  const transporationFees = students.map((s) => {
    if (s.destination) {
      return s.destination;
    }
  });

  const transportationAreas = await TransportationArea.find({
    _id: { $in: transporationFees },
  });

  const availableBills = await Bill.find({
    year,
    month,
    "student.id": { $in: studentIds },
  });

  const newBills = [];
  const toUpdateBills = [];

  const isFee = await Fee.findOne({
    class: students[0].class,
  });
  if (!isFee) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee for the student class not found`));
  }

  const lastBill = await Bill.findOne({}, {}, { sort: { _id: -1 } });

  let billNo = 1;
  if (lastBill) {
    billNo = lastBill.billNo + 1;
  }

  req.body.forEach(async (item) => {
    const { id, data } = item;

    const isAvaliable =
      availableBills.find((bill) => {
        return bill.student.id.toString() === id;
      }) || null;

    const student = students.find((student) => student._id.toString() == id);
    let transportation = 0;
    if (student.destination) {
      var fees = transportationAreas.find(
        (area) => area._id.toString() == student.destination
      );
      transportation = fees ? fees.amount : 0;
      if (student.transportFeeDiscount > 0 && transportation > 0) {
        transportation -= student.transportFeeDiscount;
      }
    }

    let schoolFee = isFee.feeAmount || 0;
    if (student.feeDiscount > 0 && schoolFee > 0) {
      schoolFee -= student.feeDiscount;
    }
    if (isAvaliable) {
      let total = 0;
      isAvaliable.admissionFee.amount = data.admissionFee;
      total += data.admissionFee;
      isAvaliable.serviceFee.amount = data.serviceFee;
      total += data.serviceFee;
      isAvaliable.schoolFee.amount = schoolFee;
      total += schoolFee;
      isAvaliable.transportation.amount = transportation;
      total += transportation;
      isAvaliable.stationaryFee.amount = data.stationaryFee;
      total += data.stationaryFee;
      isAvaliable.deposit.amount = data.deposit;
      total += data.deposit;
      isAvaliable.evaluation.amount = data.evaluation;
      total += data.evaluation;
      isAvaliable.extra.amount = data.extra;
      total += data.extra;
      isAvaliable.due.amount = data.due;
      total += data.due;
      isAvaliable.diary.amount = data.diary;
      total += data.diary;
      isAvaliable.total = total;
      isAvaliable.url = null;
      isAvaliable.isPaid = data.isPaid;
      toUpdateBills.push(isAvaliable);
    } else {
      const createBill = new Bill({
        billNo: billNo,
        date: new Date(),
        student: {
          id,
          class: student.class,
          rollNo: student.rollNumber,
        },
        month,
        year,
        admissionFee: {
          amount: data.admissionFee,
        },
        serviceFee: {
          amount: data.serviceFee,
        },

        schoolFee: {
          amount: schoolFee,
        },
        stationaryFee: {
          amount: data.stationaryFee,
        },
        deposit: {
          amount: data.deposit,
        },

        transportation: {
          amount: transportation,
        },
        evaluation: {
          amount: data.evaluation,
        },
        extra: {
          amount: data.extra,
        },
        due: {
          amount: data.due,
        },
        diary: {
          amount: data.diary,
        },
        url: null,
        isPaid: data.isPaid,
      });

      createBill.total =
        createBill.admissionFee.amount +
        createBill.serviceFee.amount +
        createBill.schoolFee.amount +
        createBill.stationaryFee.amount +
        createBill.deposit.amount +
        createBill.transportation.amount +
        createBill.evaluation.amount +
        createBill.extra.amount +
        createBill.due.amount +
        createBill.diary.amount;
      billNo++;
      newBills.push(createBill);
    }
  });

  try {
    let savedBills = [];
    if (newBills.length > 0) {
      savedBills = await Bill.insertMany(newBills);
    }
    let updatedBills = [];

    if (toUpdateBills.length > 0) {
      updatedBills = await Promise.all(
        toUpdateBills.map(async (bill) => {
          return await Bill.findByIdAndUpdate(bill._id, {
            ...bill,
          });
        })
      );
    }

    return res

      .status(201)
      .json(
        new GenericReponse(
          201,
          "Bills Created Successfully",
          savedBills.concat(updatedBills)
        )
      );
  } catch (error) {
    return res.status(500).json(new GenericError(500, error?.messag));
  }
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

const getBillsOfStudent = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Student Id"));
  }
  const sutdentsBills = await Bill.find({ "student.id": id })
    .populate("student.id", "fullName")
    .populate("student.class", "name");

  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        "Student Bills Fetched Successfully",
        sutdentsBills
      )
    );
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
    evaluation,
    extra,
    due,
    diary,
    isPaid,
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

  const isFee = await Fee.findOne({
    class: isStudent.class,
  });
  if (!isFee) {
    return res
      .status(400)
      .json(new GenericError(400, `Fee for this student class not found`));
  }

  let transportation = 0;
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
    transportation = transportationArea.amount;
    if (isStudent.transportFeeDiscount > 0 && transportation > 0) {
      transportation -= isStudent.transportFeeDiscount;
    }
  }

  let schoolFee = isFee.feeAmount || 0;
  if (isStudent.feeDiscount > 0 && schoolFee > 0) {
    schoolFee -= isStudent.feeDiscount;
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
  if (due !== null && due !== undefined) {
    toUpdate.due = {
      amount: due,
    };
  } else {
    toUpdate.due = isBill.due;
  }
  if (diary !== null && diary !== undefined) {
    toUpdate.diary = {
      amount: diary,
    };
  } else {
    toUpdate.diary = isBill.diary;
  }

  toUpdate.transportation = {
    amount: transportation,
  };
  toUpdate.schoolFee = {
    amount: schoolFee,
  };

  toUpdate.total = 0;
  toUpdate.total +=
    admissionFee != !null && admissionFee !== undefined
      ? admissionFee
      : isBill.admissionFee.amount;
  toUpdate.total +=
    serviceFee !== null && serviceFee !== undefined
      ? serviceFee
      : isBill.serviceFee.amount;
  toUpdate.total += schoolFee;
  toUpdate.total +=
    stationaryFee !== null && stationaryFee !== undefined
      ? stationaryFee
      : isBill.stationaryFee.amount;
  toUpdate.total +=
    deposit !== null && deposit !== undefined ? deposit : isBill.deposit.amount;
  toUpdate.total += transportation;
  toUpdate.total +=
    evaluation != null && evaluation !== undefined
      ? evaluation
      : isBill.evaluation.amount;
  toUpdate.total +=
    extra != null && extra !== undefined ? extra : isBill.care.extra;
  toUpdate.total += due != null && due !== undefined ? due : isBill.due.amount;
  toUpdate.total +=
    diary != null && diary !== undefined ? diary : isBill.diary.amount;
  toUpdate.url = null;
  toUpdate.isPaid = isPaid;

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
          isBill.isPaid &&
          `<p style="text-align: center">
          Bill Number:
          <span style="font-weight: bold"
            >#${isBill.billNo}</span
          >
        </p>`
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
        <div class="total">
          <p><strong>Total :</strong> Rs ${isBill.total}</p>
        </div>
        <div>
          <p>
            <strong>Amount in words:</strong> ${numberToWords(isBill.total)}
            Only
          </p>
        </div>
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

  let students = [];
  if (Array.isArray(studentIds)) {
    students = studentIds;
  } else {
    students = studentIds.split(",");
  }

  if (!Array.isArray(students)) {
    return res
      .status(400)
      .json(new GenericError(400, "Student ids should be an array"));
  }

  students.forEach((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(new GenericError(400, `Invalid student id ${id}`));
    }
  });

  const results = await Bill.find({
    year,
    month,
    "student.id": { $in: students },
  }).populate("student.id", "fullName");

  if (!results) {
    return res.status(404).json(new GenericError(500, "No bills found"));
  }

  return res
    .status(200)
    .json(new GenericReponse(200, "Bills Fetched Successfully", results));
});

export {
  addBill,
  addBulkBill,
  deleteBill,
  getBill,
  getBills,
  getBillsOfStudent,
  getBillsOfStudentIn,
  printBill,
  updateBill,
};
