import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import { Fee } from "../models/fee.model.js";
import { Student } from "../models/student.model.js";
import { TransportationFee } from "../models/transportationFee.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
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
  listOfFees.push(isBill.snack);
  listOfFees.push(isBill.transportation);
  listOfFees.push(isBill.evaluation);
  listOfFees.push(isBill.care);
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
          color: #888;
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
        <p style="text-align: center">
          Bill Number:
          <span style="font-weight: bold"
            >#${isBill.billNo}</span
          >
        </p>
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
             <strong> Date:</strong> ${convertToNepaliDate(isBill.date)}</span>
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
    .then(() => {
      res
        .status(200)
        .json(new GenericReponse(200, "Bill Printed Successfully", {}));
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          new GenericError(500, err.message || "Error while printing bill")
        );
    });
});

export { addBill, deleteBill, getBill, getBills, printBill, updateBill };
