import mongoose from "mongoose";
import { Class } from "../models/class.model.js";
import { Fee } from "../models/fee.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import { validateFeeAmount } from "../validation/fee.validation.js";
import { validateClassId } from "../validation/subject.validation.js";

const addFee = handleAsync(async (req, res) => {
  const { feeAmount, class: classId } = req.body;
  const isValidFeeAmount = validateFeeAmount(feeAmount);
  if (isValidFeeAmount) {
    return res.status(400).json(new GenericError(400, isValidFeeAmount));
  }
  const isValidClassId = validateClassId(classId);
  if (isValidClassId) {
    return res.status(400).json(new GenericError(400, isValidClassId));
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new GenericError(400, "Invalid class ID"));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(404).json(new GenericError(404, "Class not found"));
  }

  const isFee = await Fee.findOne({ class: classId });
  if (isFee) {
    return res
      .status(400)
      .json(
        new GenericError(400, `Fee already exists for class ${isClass.name}`)
      );
  }

  const newFee = await Fee.create({ feeAmount, class: classId });
  res
    .status(201)
    .json(
      new GenericReponse(201, `Fee added for class ${isClass.name}`, newFee)
    );
});

const getFees = handleAsync(async (_, res) => {
  const fees = await Fee.aggregate([
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!fees) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching fees."));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Fees fetched successfully", fees));
});

const getFeeById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json(new GenericError(400, "Fee id is not valid."));
  }
  const fee = await Fee.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!fee[0]) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Fee fetched successfully", fee[0]));
});

const getFeeByClassId = handleAsync(async (req, res) => {
  const { classId } = req.params;
  if (!mongoose.isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new GenericError(400, "Class id is not valid."));
  }

  const fee = await Fee.aggregate([
    {
      $match: {
        class: new mongoose.Types.ObjectId(classId),
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "class",
        foreignField: "_id",
        as: "classValues",
        pipeline: [
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        classValues: {
          $first: "$classValues",
        },
      },
    },
    {
      $project: {
        __v: 0,
        class: 0,
      },
    },
  ]);
  if (!fee[0]) {
    return res
      .status(404)
      .json(new GenericError(404, "Fee not found for this class"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Fee fetched successfully", fee[0]));
});

const updateFeeById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json(new GenericError(400, "Fee id is not valid."));
  }

  const { feeAmount } = req.body;
  const isValidFeeAmount = validateFeeAmount(feeAmount);
  if (isValidFeeAmount) {
    return res.status(400).json(new GenericError(400, isValidFeeAmount));
  }

  const updatedFee = await Fee.findByIdAndUpdate(
    id,
    { feeAmount },
    { new: true }
  );
  if (!updatedFee) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }

  return res.status(200).json(new GenericReponse(200, `Fee updated `, {}));
});

const deleteFeeById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json(new GenericError(400, "Fee id is not valid."));
  }
  const fee = await Fee.findByIdAndDelete(id);
  if (!fee) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Fee deleted successfully", {}));
});

export {
  addFee,
  deleteFeeById,
  getFeeByClassId,
  getFeeById,
  getFees,
  updateFeeById,
};
