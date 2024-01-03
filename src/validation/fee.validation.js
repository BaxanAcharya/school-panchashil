const validateFeeAmount = (fee) => {
  if (fee == null) {
    return "Fee amount is required";
  }
  if (fee <= 0) {
    return "Fee amount must be greater than 0";
  }
};
const validateClassId = (classId) => {
  if (classId == null) {
    return "Class ID is required";
  }
};

export { validateFeeAmount, validateClassId };
