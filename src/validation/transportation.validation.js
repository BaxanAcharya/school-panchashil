const validateArea = (area) => {
  if (!area) {
    return "Area is required";
  }
};

const validateFee = (fee) => {
  if (!fee) {
    return "Fee is required";
  }
  if (typeof fee !== "number") {
    return "Fee must be a number";
  }
  if (fee <= 0) {
    return "Fee must be greater than 0";
  }
};

export { validateArea, validateFee };
