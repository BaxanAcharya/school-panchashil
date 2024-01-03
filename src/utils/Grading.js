export const getGrade = (mark, total) => {
  if (mark == 0 || total == 0) return "-";
  const percentage = Math.round((mark / total) * 100);
  if (percentage >= 90) {
    return "A+";
  } else if (percentage >= 80) {
    return "A";
  } else if (percentage >= 70) {
    return "B+";
  } else if (percentage >= 60) {
    return "B";
  } else if (percentage >= 50) {
    return "C+";
  } else if (mark >= 40) {
    return "C";
  } else if (percentage >= 35) {
    return "D";
  } else {
    return "NA";
  }
};

export const getGpa = (mark, total) => {
  if (mark == 0 || total == 0) return 0;
  const percentage = Math.round((mark / total) * 100);
  if (percentage >= 90) {
    return 4;
  } else if (percentage >= 80) {
    return 3.6;
  } else if (percentage >= 70) {
    return 3.2;
  } else if (percentage >= 60) {
    return 2.8;
  } else if (percentage >= 50) {
    return 2.4;
  } else if (mark >= 40) {
    return 2.0;
  } else if (percentage >= 3.5) {
    return 1.6;
  } else {
    return 0;
  }
};

export const getRemarks = (grade) => {
  switch (grade) {
    case "A+":
      return "Outstanding";
    case "A":
      return "Excellent";
    case "B+":
      return "Very Good";
    case "B":
      return "Good";
    case "C+":
      return "Satisfactory";
    case "C":
      return "Acceptable";
    case "D":
      return "Basic";
    default:
      return "Poor Study Hard";
  }
};
