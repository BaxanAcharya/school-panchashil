import mongoose from "mongoose";
import { BILL_FEE_LIST } from "../constant.js";
import BillFee from "../models/billFee.model.js";
import { Class } from "../models/class.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";

const addBillFee = handleAsync(async (req, res) => {
  const { name, amount, classes, interval, classId } = req.body;

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

  if (name === BILL_FEE_LIST[2] && !classId) {
    return res.status(400).json(new GenericError(400, "Class Id is required"));
  }

  if (name === BILL_FEE_LIST[2] && classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json(new GenericError(400, "Invalid class id"));
    }
    const classRes = await Class.findById(classId);
    if (!classRes) {
      return res.status(404).json(new GenericError(404, "Class  not found"));
    }
  }

  if (!classes && BILL_FEE_LIST[2] !== name) {
    return res.status(400).json(new GenericError(400, "Classes is required"));
  }

  if (!Array.isArray(classes) && BILL_FEE_LIST[2] !== name) {
    return res
      .status(400)
      .json(new GenericError(400, "Classes must be an array"));
  }

  classes.forEach((classId) => {
    if (
      !mongoose.Types.ObjectId.isValid(classId) &&
      BILL_FEE_LIST[2] !== name
    ) {
      return res.status(400).json(new GenericError(400, "Invalid class id"));
    }
  });

  if (BILL_FEE_LIST[2] !== name) {
    const isFee = await BillFee.findOne({ name });
    if (isFee) {
      return res
        .status(400)
        .json(new GenericError(400, `${name} already exists`));
    }
  } else {
    const isFee = await BillFee.findOne({ name, class: classId });
    if (isFee) {
      return res
        .status(400)
        .json(new GenericError(400, `${name} already exists`));
    }
  }

  const cleanClasses = [];
  classes.forEach((classId) => {
    const c = cleanClasses.find((c) => c === classId);
    if (!c) {
      cleanClasses.push(classId);
    }
  });

  if (BILL_FEE_LIST[2] !== name) {
    const classRes = await Class.find({ _id: { $in: cleanClasses } });
    if (classRes.length !== cleanClasses.length && BILL_FEE_LIST[2] !== name) {
      return res.status(404).json(new GenericError(404, "Class not Found"));
    }
  }

  try {
    const billFee = await BillFee.create({
      name,
      amount,
      classes:
        name === BILL_FEE_LIST[2]
          ? []
          : cleanClasses.length > 0
            ? cleanClasses
            : [],
      interval: interval || 0,
      class: name === BILL_FEE_LIST[2] ? classId : undefined,
    });
    res
      .status(201)
      .json(new GenericReponse(201, "Bill fee Created SuccessFully", billFee));
  } catch (error) {
    res
      .status(400)
      .json(new GenericError(500, "Error while creating bill fee"));
  }
});

const getBillFees = handleAsync(async (_, res) => {
  try {
    const billFees = await BillFee.find()
      .populate("class", "name section")
      .populate("classes", "name section")
      .sort([["class", 1]]);
    return res
      .status(200)
      .json(
        new GenericReponse(200, "Bill Fees fetched successfully", billFees)
      );
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching bill fees"));
  }
});

const getBillFee = handleAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid id"));
  }

  try {
    const billFee = await BillFee.findById(id)
      .populate("class", "name section")
      .populate("classes", "name section");
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
});

const deleteBillFee = handleAsync(async (req, res) => {
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
});
const updateBillFee = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, interval, classes } = req.body;
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

  const cleanClasses = [];
  if (isBillFee.name !== BILL_FEE_LIST[2]) {
    if (!classes) {
      return res.status(400).json(new GenericError(400, "Classes is required"));
    }
    if (!Array.isArray(classes)) {
      return res
        .status(400)
        .json(new GenericError(400, "Classes must be an array"));
    }
    classes.forEach((classId) => {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json(new GenericError(400, "Invalid class id"));
      }
    });
    classes.forEach((classId) => {
      const c = cleanClasses.find((c) => c === classId);
      if (!c) {
        cleanClasses.push(classId);
      }
    });

    const classRes = await Class.find({ _id: { $in: cleanClasses } });
    if (classRes.length !== cleanClasses.length) {
      return res.status(404).json(new GenericError(404, "Class not Found"));
    }
  }
  try {
    const billFee = await BillFee.findByIdAndUpdate(
      id,
      {
        amount,
        interval: interval || 0,
        classes:
          isBillFee.name === BILL_FEE_LIST[2]
            ? []
            : cleanClasses.length > 0
              ? cleanClasses
              : [],
      },
      { new: true }
    )
      .populate("class", "name section")
      .populate("classes", "name section");
    return res
      .status(200)
      .json(new GenericReponse(200, "Bill Fee updated successfully", billFee));
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while updating bill fee"));
  }
});
export { addBillFee, deleteBillFee, getBillFee, getBillFees, updateBillFee };
