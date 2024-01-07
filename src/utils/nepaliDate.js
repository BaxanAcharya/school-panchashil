import NepaliDate from "nepali-date-converter";
const convertToNepaliDate = (date) => {
  const nepaliDate = new NepaliDate(date);
  return nepaliDate.format("YYYY-MM-DD");
};

const getNepaliMonthName = (monthNumber) => {
  const months = [
    "Baishakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ];

  if (monthNumber >= 1 && monthNumber <= 12) {
    return months[monthNumber - 1];
  } else {
    return "Invalid month number";
  }
};

export { convertToNepaliDate, getNepaliMonthName };
