const validateName = (name) => {
  if (!name) {
    return "Name is required";
  }
};

const validateYear = (year) => {
  if (!year) {
    return "Year is required";
  }
  if (year < 2000 || year > 2100) {
    return "Year must be between 2000 and 2100";
  }
};

export { validateName, validateYear };
