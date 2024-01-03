const validateName = (name) => {
  if (!name) {
    return "Name is required.";
  }
  if (name.length > 15) {
    return "Name cannot be longer than 50 characters.";
  }
};

const validateFullMarks = (fullMarks) => {
  if (fullMarks == null) {
    return "Full marks is required.";
  }
  if (fullMarks <= 0) {
    return "Full marks cannot less than or equal to 0.";
  }
  if (fullMarks > 100) {
    return "Full marks cannot be greater than 100.";
  }
};

const validateDisplayOrder = (displayOrder) => {
  if (displayOrder == null) {
    return "Display order is required.";
  }
};

const validateClassId = (classId) => {
  if (!classId) {
    return "Class is required.";
  }
};

export {
  validateClassId,
  validateDisplayOrder,
  validateFullMarks,
  validateName,
};
