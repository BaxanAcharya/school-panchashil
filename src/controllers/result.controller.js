import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { Class } from "../models/class.model.js";
import { Exam } from "../models/exam.model.js";
import Result from "../models/result.model.js";
import { Student } from "../models/student.model.js";
import { Subject } from "../models/subject.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { getGpa, getGrade, getRemarks } from "../utils/Grading.js";
import { uplaodOnBucket } from "../utils/bucket.js";
import { handleAsync } from "../utils/handleAsync.js";
import { generatePDF } from "../utils/pdf.js";
import {
  validAttendence,
  validClass,
  validExam,
  validMarks,
  validStudent,
} from "../validation/mark.validation.js";

const getString = (result) => {
  let rows = "";
  result.forEach((item, index) => {
    rows +=
      "<tr>\n" +
      "<td>" +
      (index + 1) +
      "</td>\n<td>" +
      item.subject +
      "</td>\n<td>" +
      getGpa(item.mark, item.fullMarks) +
      "</td>\n<td>" +
      getGrade(item.mark, item.fullMarks) +
      "</td>\n" +
      "</tr>";
  });

  return rows;
};

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
    student: {
      id: student,
      rollNo: isStudent.rollNumber,
    },
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
    .populate("student.id", "fullName fatherName")
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
    .populate("student.id", "fullName fatherName")
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
      url: null,
    },
    { new: true }
  )
    .populate("student.id", "fullName fatherName")
    .populate("class", "name section")
    .populate("exam", "name year");
  if (!result) {
    return res.status(404).json(new GenericError(404, "Result not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Result updated", result));
});
const printMarkSheet = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid result id"));
  }
  const result = await Result.findById(id)
    .populate("student.id", "fullName fatherName")
    .populate("class", "name section")
    .populate("exam", "name year");
  if (!result) {
    return res.status(404).json(new GenericError(404, "Result not found"));
  }

  if (result.url) {
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Printed Successfully", result));
  }

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
          max-width: 665px;
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
        <p
          style="
            text-align: center;
            font-weight: bold;
            margin-top: 10px;
            font-size: large;
          "
        >
         ${result.exam.name} ${result.exam.year}
        </p>
        <p
          style="
            text-align: center;
            font-weight: bold;
            margin-top: -10px;
            font-size: x-large;
            color: #0d7285;
          "
        >
          Student's Progress Report
        </p>
        <div class="student-info">
          <div>
            <p><strong> Name:</strong> ${result.student.id.fullName}</p>
            <p><strong>Class:</strong> ${result.class.name} ${
              result.class.section || ""
            }</p>
          </div>
          <div>
            <p><strong>Father's Name:</strong> ${
              result.student.id.fatherName
            }</p>
            <p><strong> Roll No:</strong> ${result.student.rollNo}</p>
          </div>
        </div>
        <hr />
        <div style="display: flex">
          <table>
            <thead>
              <tr>
                <th>S.N</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
             ${getString(result.marks)}
            </tbody>
          </table>
          <div>
            <img
              src="https://panchashil.s3.amazonaws.com/logo/logo-circel.png"
              height="150px"
              width="150px"
              style="object-fit: contain; margin-left: 100px"
              alt="Circle logo"
            />
            <table style="margin-left: 10px">
              <thead>
                <tr>
                  <th>Interval in %</th>
                  <th>Grade</th>
                  <th>Description</th>
                  <th>Grade Point</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>90 to 100</td>
                  <td>A+</td>
                  <td>Outstanding</td>
                  <td>4</td>
                </tr>
                <tr>
                  <td>80 to 90</td>
                  <td>A</td>
                  <td>Excellent</td>
                  <td>3.6</td>
                </tr>
                <tr>
                  <td>70 to 80</td>
                  <td>B+</td>
                  <td>Very Good</td>
                  <td>3.2</td>
                </tr>
                <tr>
                  <td>60 to 70</td>
                  <td>B</td>
                  <td>Good</td>
                  <td>2.8</td>
                </tr>
                <tr>
                  <td>50 to 60</td>
                  <td>C+</td>
                  <td>Satisfactory</td>
                  <td>2.4</td>
                </tr>
                <tr>
                  <td>40 to 50</td>
                  <td>C</td>
                  <td>Acceptable</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>35 to 40</td>
                  <td>D</td>
                  <td>Basic</td>
                  <td>1.6</td>
                </tr>
                <tr>
                  <td>Below 35</td>
                  <td>NA</td>
                  <td>Not Applicable</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
  
        <div class="total">
          <p><strong>Total Marks Obtained:</strong> ${result.total}</p>
        </div>
        <hr />
        <div class="student-info">
          <div>
            <p><strong>GPA:</strong> ${result.gpa}</p>
            <p><strong> Remarks:</strong> ${result.remarks}</p>
          </div>
          <div>
            <p style="margin-top: 10px"><strong>Grade :</strong> ${
              result.grade
            }</p>
            <p style="margin-top: 10px"><strong> Attendence:</strong> ${
              result.attendence
            } days</p>
          </div>
        </div>
  
        <div class="student-info">
          <div>
            <p>----------------</p>
            <p style="margin-top: 0px">Class Teacher</p>
          </div>
          <div>
            <p>----------------</p>
            <p style="margin-top: 0px">Principal</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
  //print the mark sheet and save the pdf in the database and return the url

  generatePDF(html, `marksheet-${result._id}.pdf`)
    .then(async () => {
      const __dirname = fileURLToPath(import.meta.url);
      const filePath = path.join(
        __dirname,
        `../../../public/temp/marksheet-${id}.pdf`
      );
      const pathUrl = await uplaodOnBucket(filePath);
      result.url = pathUrl;
      await result.save();
      res
        .status(200)
        .json(new GenericReponse(200, "Bill Printed Successfully", result));
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          new GenericError(500, err.message || "Error while printing bill")
        );
    });
});
const generateLedger = handleAsync(async (req, res) => {
  const { examId, classId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return res.status(400).json(new GenericError(400, "Invalid exam id"));
  }
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new GenericError(400, "Invalid class id"));
  }
  const _class = await Class.findById(classId);
  if (!_class) {
    return res.status(404).json(new GenericError(404, "Class not found"));
  }
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json(new GenericError(404, "Exam not found"));
  }

  const results = await Result.find({ exam: examId }).populate(
    "student.id",
    "fullName"
  );

  //sort the results by rollNo
  results.sort((a, b) => a.student.rollNo - b.student.rollNo);

  const cleanData = results.map((result, i) => {
    const data = {
      ["S.N"]: i + 1,
      ["Students Name"]: result.student.id.fullName,
    };
    result.marks.forEach((mark) => {
      data[mark.subject] = mark.mark;
    });
    data["Attendence"] = result.attendence;
    data["Total"] = result.total;
    data["Percentage"] = result.percentage;
    data["Grade"] = result.grade;
    data["GPA"] = result.gpa;
    data["Remarks"] = result.remarks;
    return data;
  });

  try {
    const workSheet = XLSX.utils.json_to_sheet(cleanData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Ledger");
    const __dirname = fileURLToPath(import.meta.url);
    const fileName = `${exam.name}-${exam.year}-${_class.name}.xlsx`;
    const filePath = path.join(__dirname, `../../../public/temp/${fileName}`);
    XLSX.writeFile(workBook, filePath);
    const pathUrl = await uplaodOnBucket(filePath);
    res.status(200).json(new GenericReponse(200, "Ledger", pathUrl));
  } catch (error) {
    res
      .status(500)
      .json(
        new GenericError(500, error.message || "Error while generating ledger")
      );
  }

  // return res.send(cleanData);
  // res
  //   .status(200)
  //   .json(new GenericReponse(200, "Ledger", { exam, _class, results }));
});

export {
  addResult,
  deleteResult,
  generateLedger,
  getResultById,
  getResults,
  printMarkSheet,
  updateResult,
};
