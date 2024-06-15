import mongoose from "mongoose";
import { BILL_FEE_LIST } from "../constant.js";
import BillFee from "../models/billFee.model.js";
import { Class } from "../models/class.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";

const addBillFee = async (req, res) => {
  const { name, amount, class: classId, interval } = req.body;

  if (!name) {
    return res.status(400).json(new GenericError(400, "Name is required"));
  } else {
    if (!BILL_FEE_LIST.includes(name)) {
      return res
        .status(400)
        .json(
          new GenericError(
            400,
            `Name is not valid. The valid names are ${BILL_FEE_LIST.join(", ")}`
          )
        );
    }
  }

  if (name === BILL_FEE_LIST[2] && !classId) {
    return res
      .status(400)
      .json(new GenericError(400, `Class is required for ${name}`));
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json(new GenericError(400, "Amount is required"));
  } else {
    if (typeof amount !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Amount must be a number"));
    }
    if (amount <= 0) {
      return res
        .status(400)
        .json(new GenericError(400, "Amount must be greater than 0"));
    }
  }

  if (classId && name === BILL_FEE_LIST[2]) {
    const isClass = await Class.findById(classId);
    if (!isClass) {
      return res.status(400).json(new GenericError(400, "Class not found"));
    }
  }

  if (interval && typeof interval !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Interval must be a number"));
  }

  if (name === BILL_FEE_LIST[2]) {
    const isFee = await BillFee.findOne({ name, class: classId });
    if (isFee) {
      return res
        .status(400)
        .json(new GenericError(400, `${name}  already exists for this class`));
    }
  } else {
    const isFee = await BillFee.findOne({ name });
    if (isFee) {
      return res
        .status(400)
        .json(new GenericError(400, `${name} already exists`));
    }
  }

  try {
    const billFee = await BillFee.create({
      name,
      amount,
      class: name !== BILL_FEE_LIST[2] ? undefined : classId,
      interval: interval || 0,
    });
    res
      .status(201)
      .json(new GenericReponse(201, "Bill fee Created SuccessFully", billFee));
  } catch (error) {
    res
      .status(400)
      .json(new GenericError(500, "Error while creating bill fee"));
  }
};

const getBillFees = async (_, res) => {
  try {
    const billFees = await BillFee.find()
      .populate("class", "name section")
      .sort([["class", 1]]);
    return res
      .status(200)
      .json(
        new GenericReponse(200, "Bill Fees fetched successfully", billFees)
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching bill fees"));
  }
};

const getBillFee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }

  try {
    const billFee = await BillFee.findById(id).populate(
      "class",
      "name section"
    );
    if (!billFee) {
      return res.status(404).json(new GenericError(404, "Bill Fee not found"));
    }
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Fee fetched successfully", billFee));
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching bill fee"));
  }
};

const deleteBillFee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }

  try {
    const billFee = await BillFee.findByIdAndDelete(id);
    if (!billFee) {
      return res.status(404).json(new GenericError(404, "Bill Fee not found"));
    }
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Fee deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while deleting bill fee"));
  }
};
const updateBillFee = async (req, res) => {
  const { id } = req.params;
  const { amount, interval } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json(new GenericError(400, "Amount is required"));
  } else {
    if (typeof amount !== "number") {
      return res
        .status(400)
        .json(new GenericError(400, "Amount must be a number"));
    }
    if (amount <= 0) {
      return res
        .status(400)
        .json(new GenericError(400, "Amount must be greater than 0"));
    }
  }

  if (interval && typeof interval !== "number") {
    return res
      .status(400)
      .json(new GenericError(400, "Interval must be a number"));
  }

  const isBillFee = await BillFee.findById(id);
  if (!isBillFee) {
    return res.status(404).json(new GenericError(404, "Bill Fee not found"));
  }
  try {
    const billFee = await BillFee.findByIdAndUpdate(
      id,
      {
        amount,
        interval: interval || 0,
      },
      { new: true }
    ).populate("class", "name section");
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Fee updated successfully", billFee));
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while updating bill fee"));
  }
};
export { addBillFee, deleteBillFee, getBillFee, getBillFees, updateBillFee };
