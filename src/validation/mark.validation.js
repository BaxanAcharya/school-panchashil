import mongoose from "mongoose";

const validStudent = (student) => {
  if (!student) {
    return "Student is required";
  }
};

const validClass = (classId) => {
  if (!classId) {
    return "Class is required";
  }
};

const validExam = (exam) => {
  if (!exam) {
    return "Exam is required";
  }
};

const validMarks = (marks) => {
  if (!marks) {
    return "Marks is required";
  }
  if (!Array.isArray(marks)) {
    return "Marks must be an array";
  }
  if (marks.length === 0) {
    return "Marks must not be empty";
  }
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (typeof mark !== "object") {
      return "Mark must be an object";
    }
    if (!mark.subject || !mark.mark) {
      return "Mark must have subject and mark property";
    }
    if (typeof mark.subject !== "string") {
      return "Subject must be a string";
    }
    if (!mongoose.Types.ObjectId.isValid(mark.subject)) {
      return "Invalid subject id";
    }
    if (typeof mark.mark !== "number") {
      return "Mark must be a number";
    }
  }

  //check if the subject is unique
  const subjectIds = marks.map((mark) => mark.subject);
  const uniqueSubjectIds = [...new Set(subjectIds)];
  if (subjectIds.length !== uniqueSubjectIds.length) {
    return "Subject must not be duplicate";
  }
};

const validAttendence = (attendence) => {
  if (!attendence) {
    return "Attendence is required";
  }
  if (typeof attendence !== "number") {
    return "Attendence must be a number";
  }
};

export { validAttendence, validClass, validExam, validMarks, validStudent };
