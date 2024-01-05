import { mongo } from "mongoose";

const validateArea = (area) => {
  if (!area) {
    return "Name is required";
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

const validateFrom = (from) => {
  if (!from) {
    return "From is required";
  }
  if (!mongo.ObjectId.isValid(from)) {
    return "Invalid From";
  }
};
const validateTo = (to) => {
  if (!to) {
    return "To is required";
  }
  if (!mongo.ObjectId.isValid(to)) {
    return "Invalid To";
  }
};

export { validateArea, validateFee, validateFrom, validateTo };
