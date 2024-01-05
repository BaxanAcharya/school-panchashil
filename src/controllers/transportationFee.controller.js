import mongoose from "mongoose";
import { TransportationArea } from "../models/transportation.model";
import { TransportationFee } from "../models/transportationFee";
import { GenericError } from "../utils/GenericError";
import { handleAsync } from "../utils/handleAsync";
import { validateFee } from "../validation/transportation.validation";

const addTransportationFee = handleAsync(async (req, res) => {
  const { from, to, fee } = req.body;
  if (!mongoose.Types.ObjectId.isValid(from)) {
    return res.status(400).json(new GenericError(400, "Invalid From"));
  }

  if (!mongoose.Types.ObjectId.isValid(to)) {
    return res.status(400).json(new GenericError(400, "Invalid To"));
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

  const areaFee = TransportationFee.create({
    from,
    to,
    fee,
  });

  if (!areaFee) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }
  res
    .status(201)
    .json(new GenericReponse(201, "Area Added Successfully", areaFee));
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
    .populate("from", "name")
    .populate("to", "name");
  res.json(new GenericReponse(200, "Fees Fetched Successfully", fees));
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
  res.json(new GenericReponse(200, "Fee Fetched Successfully", fee));
});

const updateTransportationFee = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { from, to, fee } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }

  if (!mongoose.Types.ObjectId.isValid(from)) {
    return res.status(400).json(new GenericError(400, "Invalid From"));
  }

  if (!mongoose.Types.ObjectId.isValid(to)) {
    return res.status(400).json(new GenericError(400, "Invalid To"));
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

  const isFee = await TransportationFee.find({
    from,
    to,
  });

  if (isFee) {
    return res
      .status(400)
      .json(new GenericError(400, "Fee already exists for this area"));
  }

  const areaFee = await TransportationFee.findByIdAndUpdate(
    id,
    {
      from,
      to,
      fee,
    },
    { new: true }
  );

  if (!areaFee) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }
  res
    .status(201)
    .json(new GenericReponse(201, "Area Updated Successfully", areaFee));
});

export {
  addTransportationFee,
  getTransportationFee,
  getTransportationFees,
  updateTransportationFee,
};
