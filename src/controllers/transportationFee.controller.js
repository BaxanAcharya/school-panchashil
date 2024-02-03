import mongoose from "mongoose";
import { TransportationArea } from "../models/transportation.model.js";
import { TransportationFee } from "../models/transportationFee.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  validateFee,
  validateFrom,
  validateTo,
} from "../validation/transportation.validation.js";

const addTransportationFee = handleAsync(async (req, res) => {
  const { from, to, fee } = req.body;
  const isValidFrom = validateFrom(from);
  if (isValidFrom) {
    return res.status(400).json(new GenericError(400, isValidFrom));
  }
  const isValidTo = validateTo(to);
  if (isValidTo) {
    return res.status(400).json(new GenericError(400, isValidTo));
  }
  const isValidFee = validateFee(fee);
  if (isValidFee) {
    return res.status(400).json(new GenericError(400, isValidFee));
  }

  const fromArea = await TransportationArea.findById(from);
  if (!fromArea) {
    return res
      .status(404)
      .json(new GenericError(404, `From Area ${from} not found`));
  }

  const toArea = await TransportationArea.findById(to);
  if (!toArea) {
    return res
      .status(404)
      .json(new GenericError(404, `To Area ${to} not found`));
  }

  const isFee = await TransportationFee.findOne({
    from,
    to,
  });
  if (isFee) {
    return res
      .status(409)
      .json(
        new GenericError(
          409,
          `TransportationFee Fee already exists from area ${fromArea.name} to ${toArea.name}`
        )
      );
  }

  const areaFee = await TransportationFee.create({
    from,
    to,
    fee,
  });

  if (!areaFee) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }
  res
    .status(201)
    .json(
      new GenericReponse(201, "Transportation Fee Added Successfully", areaFee)
    );
});

const getTransportationFees = handleAsync(async (req, res) => {
  const { from, to } = req.query;
  const query = {};
  if (from) {
    if (!mongoose.Types.ObjectId.isValid(from)) {
      return res.status(400).json(new GenericError(400, "Invalid From"));
    }
    query.from = from;
  }
  if (to) {
    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json(new GenericError(400, "Invalid To"));
    }
    query.to = to;
  }
  const fees = await TransportationFee.find(query)
    .populate("from", "name ")
    .populate("to", "name");
  res.json(
    new GenericReponse(200, "TransportationFee Fees Fetched Successfully", fees)
  );
});

const getTransportationFee = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const fee = await TransportationFee.findById(id)
    .populate("from", "name")
    .populate("to", "name");
  if (!fee) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }
  res.json(
    new GenericReponse(200, "TransportationFee Fee Fetched Successfully", fee)
  );
});

const updateTransportationFee = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { fee } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }

  const isValidFee = validateFee(fee);
  if (isValidFee) {
    return res.status(400).json(new GenericError(400, isValidFee));
  }

  const areaFee = await TransportationFee.findByIdAndUpdate(
    id,
    {
      fee,
    },
    { new: true }
  );

  if (!areaFee) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }
  res
    .status(201)
    .json(
      new GenericReponse(
        201,
        "Transportation Fee Updated Successfully",
        areaFee
      )
    );
});

const deleteTransportationFee = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const fee = await TransportationFee.findByIdAndDelete(id);
  if (!fee) {
    return res.status(404).json(new GenericError(404, "Fee not found"));
  }
  res
    .status(200)
    .json(
      new GenericReponse(200, "Transportation Fee Deleted Successfully", {})
    );
});

export {
  addTransportationFee,
  deleteTransportationFee,
  getTransportationFee,
  getTransportationFees,
  updateTransportationFee,
};
