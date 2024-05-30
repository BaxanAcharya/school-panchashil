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
    if (mark.subject === undefined || mark.mark === undefined) {
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
  if (attendence === undefined) {
    return "Attendence is required";
  }
  if (typeof attendence !== "number") {
    return "Attendence must be a number";
  }
};

const haha = {
  result: [
    {
      student: "66572436bd6bf3aa5a17fb18",
      marks: [
        {
          subject: "6657601d23f85d85425064e8",
          name: "ENGLISH",
          mark: 5,
        },
        {
          subject: "6657601d23f85d85425064e9",
          name: "NEPALI",
          mark: 0,
        },
        {
          subject: "6657601d23f85d85425064ea",
          name: "MATH",
          mark: 0,
        },
        {
          subject: "6657601d23f85d85425064eb",
          name: "SCIENCE",
          mark: 0,
        },
      ],
      attendence: 0,
    },
    {
      student: "65bf5913f1549fcfdd3280ab",
      marks: [
        {
          subject: "66575fef23f85d85425064bf",
          name: "ENGLISH",
          mark: 100,
        },
        {
          subject: "66575fef23f85d85425064c0",
          name: "NEPALI",
          mark: 100,
        },
        {
          subject: "66575fef23f85d85425064c1",
          name: "MATH",
          mark: 89,
        },
        {
          subject: "66575fef23f85d85425064c2",
          name: "SCIENCE",
          mark: 0,
        },
      ],
      attendence: 32,
    },
  ],
};

const validBulkResult = (value) => {
  const { result } = value;
  if (!result) {
    return "Result are required";
  }
  if (!Array.isArray(result)) {
    return "Marks must be an array";
  }

  for (let i = 0; i < result.length; i++) {
    const mark = result[i];
    if (typeof mark !== "object") {
      return "Mark must be an object";
    }
    if (mark.student === undefined || mark.marks === undefined) {
      return "Mark must have student and marks property";
    }
    if (typeof mark.student !== "string") {
      return "Student must be a string";
    }
    if (!mongoose.Types.ObjectId.isValid(mark.student)) {
      return "Invalid student id";
    }
    if (typeof mark.marks !== "object") {
      return "Marks must be an object";
    }
    if (!Array.isArray(mark.marks)) {
      return "Marks must be an array";
    }
    if (mark.marks.length === 0) {
      return "Marks must not be empty";
    }
    for (let j = 0; j < mark.marks.length; j++) {
      const markR = mark.marks[j];
      if (typeof markR !== "object") {
        return "Mark must be an object";
      }
      if (markR.subject === undefined || markR.mark === undefined) {
        return "Mark must have subject and mark property";
      }
      if (typeof markR.subject !== "string") {
        return "Subject must be a string";
      }

      if (typeof markR.mark !== "number") {
        return "Mark must be a number";
      }
    }
  }
};

export {
  validAttendence,
  validBulkResult,
  validClass,
  validExam,
  validMarks,
  validStudent,
};
