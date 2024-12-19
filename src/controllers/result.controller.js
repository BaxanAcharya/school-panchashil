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
import {
  validAttendence,
  validBulkResult,
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

  const resultExist = await Result.findOne({
    "student.id": new mongoose.Types.ObjectId(student),
    class: classId,
    exam,
  });
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

const addResultBulk = handleAsync(async (req, res) => {
  const { examId } = req.params;
  const isValidMarks = validBulkResult(req.body);
  if (isValidMarks) {
    return res.status(400).json(new GenericError(400, isValidMarks));
  }

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return res.status(400).json(new GenericError(400, "Invalid exam id"));
  }
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json(new GenericError(404, "Exam not found"));
  }

  const { result } = req.body;
  const studentIds = result.map((mark) => mark.student);
  const students = await Student.find({ _id: { $in: studentIds } });

  if (students.length !== studentIds.length) {
    return res
      .status(404)
      .json(new GenericError(404, "One or more students not found"));
  }

  const subjects = await Subject.find({ class: students[0].class });
  const avaliableMarks = await Result.find({
    "student.id": {
      $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
    exam: new mongoose.Types.ObjectId(examId),
  });
  const newResults = [];
  const toUpdateResults = [];
  result.forEach((result) => {
    const isAvaliable = avaliableMarks.find(
      (mark) => mark.student.id.toString() === result.student
    );
    if (isAvaliable) {
      const marks = [];
      result.marks.forEach((mark) => {
        const subject = subjects.find((s) => s.name === mark.name);
        if (subject) {
          marks.push({
            subject: subject.name,
            fullMarks: subject.fullMarks,
            mark: mark.mark,
          });
        }
      });

      isAvaliable.marks = marks;
      isAvaliable.attendence = result.attendence;
      isAvaliable.url = null;
      const totalSubjectMarks = isAvaliable.marks.reduce(
        (total, subject) => total + subject.fullMarks,
        0
      );

      const totalMarksObtained = isAvaliable.marks.reduce(
        (total, subject) => total + subject.mark,
        0
      );
      isAvaliable.total = totalMarksObtained;
      const roundedPercentage = (totalMarksObtained / totalSubjectMarks) * 100;
      const percentage =
        roundedPercentage % 1 === 0
          ? roundedPercentage.toFixed(0)
          : roundedPercentage.toFixed(2);
      isAvaliable.percentage = percentage;

      const grade = getGrade(totalMarksObtained, totalSubjectMarks);
      isAvaliable.grade = grade;
      const gpa = getGpa(totalMarksObtained, totalSubjectMarks);
      isAvaliable.gpa = gpa;
      const remarks = getRemarks(grade);
      isAvaliable.remarks = remarks;
      toUpdateResults.push(isAvaliable);
    } else {
      const createResult = new Result({
        student: {
          id: result.student,
          rollNo: students.find((s) => s._id.toString() === result.student)
            .rollNumber,
        },
        class: students[0].class,
        exam: examId,
        marks: result.marks.map((mark) => {
          const subject = subjects.find((s) => s.name === mark.name);
          if (subject) {
            return {
              subject: subject.name,
              fullMarks: subject.fullMarks,
              mark: mark.mark,
            };
          }
        }),
        attendence: result.attendence,
      });

      createResult.url = null;
      const totalSubjectMarks = createResult.marks.reduce(
        (total, subject) => total + subject.fullMarks,
        0
      );

      const totalMarksObtained = createResult.marks.reduce(
        (total, subject) => total + subject.mark,
        0
      );
      createResult.total = totalMarksObtained;
      const roundedPercentage = (totalMarksObtained / totalSubjectMarks) * 100;
      const percentage =
        roundedPercentage % 1 === 0
          ? roundedPercentage.toFixed(0)
          : roundedPercentage.toFixed(2);
      createResult.percentage = percentage;

      const grade = getGrade(totalMarksObtained, totalSubjectMarks);
      createResult.grade = grade;
      const gpa = getGpa(totalMarksObtained, totalSubjectMarks);
      createResult.gpa = gpa;
      const remarks = getRemarks(grade);
      createResult.remarks = remarks;
      newResults.push(createResult);
    }
  });

  try {
    const newResult = await Result.insertMany(newResults);
    const result = await Promise.all(
      toUpdateResults.map(async (item) => {
        return await item.save();
      })
    );
    return res
      .status(201)
      .json(new GenericReponse(201, "Results added", [result, ...newResult]));
  } catch (error) {
    return res.status(500).json(new GenericError(500, error?.messag));
  }
});
const getResults = handleAsync(async (req, res) => {
  const { student, class: classId, exam } = req.query;
  const query = {};
  if (student) {
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json(new GenericError(400, "Invalid student id"));
    }
    query["student.id"] = new mongoose.Types.ObjectId(student);
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

const printBulkMarkSheet = handleAsync(async (req, res) => {
  const { examId, classId } = req.params;
  const { studentIds } = req.query;
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return res.status(400).json(new GenericError(400, "Invalid exam id"));
  }
  if (!studentIds) {
    return res
      .status(400)
      .json(new GenericError(400, "Student ids are required"));
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

  const isExam = await Exam.findById(examId);
  if (!isExam) {
    return res.status(404).json(new GenericError(404, "Exam not found"));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(404).json(new GenericError(404, "Class not found"));
  }

  const studentRes = await Student.find({ _id: { $in: students } });
  if (students.length != studentRes.length) {
    return res.status(404).json(new GenericError(404, "Students not found"));
  }

  const results = await Result.find({
    "student.id": { $in: students },
    exam: examId,
    class: classId,
  })
    .populate("student.id", "fullName fatherName")
    .populate("class", "name section")
    .populate("exam", "name year");

  if (!results) {
    return res.status(500).json(new GenericError(500, "Internal server error"));
  }

  const content = results
    .map((result) => {
      return ` <div class="container">
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
        <div class="student-info" style="margin-top:-15px;">
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
        <hr class="divider" />
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

      
        <div style="display:flex; justify-content: space-between;">
         <p><strong>GPA:</strong> ${result.gpa}</p>
           <p ><strong>Grade :</strong> ${result.grade}</p>
          <p><strong>Total Marks Obtained:</strong> ${result.total}</p>
        </div>
  
      
        <div class="student-info" style="margin-top:-15px;" >
          <div>
            <p><strong> Remarks:</strong> ${result.remarks}</p>
          </div>
          <div>
            <p ><strong> Attendence:</strong> ${result.attendence} days</p>
          </div>
        </div>
  
        <div class="student-info" style="margin-top:-25px;">
            <p style="margin-top: 0px">Class Teacher</p>
            <p style="margin-top: 0px">Principal</p>
        </div>
      </div>`;
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

        .divider {
          height: 2px; 
          border: none; 
          background-color: black;
        }
      </style>
    </head>
    <body>
     ${content}
    </body>
  </html>`;

  res
    .status(200)
    .json(new GenericReponse(200, "Marksheet Fetched Successfully", html));
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

        .divider {
          height: 2px; 
          border: none; 
          background-color: black;
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
        <div class="student-info" style="margin-top:-15px;">
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
        <hr class="divider" />
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

      
        <div style="display:flex; justify-content: space-between;">
         <p><strong>GPA:</strong> ${result.gpa}</p>
           <p ><strong>Grade :</strong> ${result.grade}</p>
          <p><strong>Total Marks Obtained:</strong> ${result.total}</p>
        </div>
  
      
        <div class="student-info" style="margin-top:-15px;" >
          <div>
            <p><strong> Remarks:</strong> ${result.remarks}</p>
          </div>
          <div>
            <p ><strong> Attendence:</strong> ${result.attendence} days</p>
          </div>
        </div>
  
        <div class="student-info" style="margin-top:-25px;">
            <p style="margin-top: 0px">Class Teacher</p>
            <p style="margin-top: 0px">Principal</p>
        </div>
      </div>
    </body>
  </html>`;
  //print the mark sheet and save the pdf in the database and return the url
  return res
    .status(200)
    .json(new GenericReponse(200, "MarkSheet Fetched Successfully", html));
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

  const results = await Result.find({ exam: examId, class: classId })
    .populate("student.id", "fullName")
    .populate("class", "name section");

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
});

const getResultsOfStudentIn = handleAsync(async (req, res) => {
  const { examId } = req.params;
  const { studentIds } = req.query;
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return res.status(400).json(new GenericError(400, "Invalid exam id"));
  }

  if (!studentIds) {
    return res
      .status(400)
      .json(new GenericError(400, "Student ids are required"));
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
  const results = await Result.find({
    "student.id": { $in: students },
    exam: examId,
    marks: { $ne: null },
    total: { $ne: null },
    percentage: { $ne: null },
    grade: { $ne: null },
    gpa: { $ne: null },
    remarks: { $ne: null },
    attendence: { $ne: null },
  })
    .populate("student.id", "fullName fatherName rollNumber")
    .populate("class", "name section")
    .populate("exam", "name year")
    .populate("marks")
    .populate("total")
    .populate("percentage")
    .populate("grade")
    .populate("gpa")
    .populate("remarks")
    .populate("attendence");

  if (!results) {
    return res.status(500).json(new GenericError(500, "Internal server error"));
  }
  return res.status(200).json(new GenericReponse(200, "Results", results));
});

export {
  addResult,
  addResultBulk,
  deleteResult,
  generateLedger,
  printBulkMarkSheet,
  getResultById,
  getResults,
  getResultsOfStudentIn,
  printMarkSheet,
  updateResult,
};
