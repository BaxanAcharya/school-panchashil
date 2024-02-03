import mongoose from "mongoose";
import { TransportationArea } from "../models/transportation.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import { validateArea } from "../validation/transportation.validation.js";

const addTransportationArea = handleAsync(async (req, res) => {
  const { name } = req.body;
  const isAreaValid = validateArea(name);
  if (isAreaValid) {
    return res.status(400).json(new GenericError(400, isAreaValid));
  }

  const area = await TransportationArea.findOne({ name });
  if (area) {
    return res
      .status(409)
      .json(
        new GenericError(409, `Area with name ${area.name} already exists`)
      );
  }

  const transportationArea = await TransportationArea.create({
    name,
  });
  if (!transportationArea) {
    return res.status(500).json(new GenericError(500, "Something went wrong"));
  }

  res
    .status(201)
    .json(
      new GenericReponse(201, "Area Added Successfully", transportationArea)
    );
});

const getAreas = handleAsync(async (_, res) => {
  const areas = await TransportationArea.find();
  res
    .status(200)
    .json(new GenericReponse(200, "Areas fetched successfully", areas));
});

const getAreaById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const area = await TransportationArea.findById(id);
  if (!area) {
    return res.status(404).json(new GenericError(404, "Area not found"));
  }
  res
    .status(200)
    .json(new GenericReponse(200, "Area fetched successfully", area));
});

const updateArea = handleAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const { name } = req.body;
  const isAreaValid = validateArea(name);
  if (isAreaValid) {
    return res.status(400).json(new GenericError(400, isAreaValid));
  }

  const area = await TransportationArea.findById(id);
  if (!area) {
    return res.status(404).json(new GenericError(404, "Area not found"));
  }
  const updatedArea = await TransportationArea.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  );
  res
    .status(200)
    .json(new GenericReponse(200, "Area updated successfully", {}));
});

const deleteArea = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new GenericError(400, "Invalid Id"));
  }
  const deletedArea = await TransportationArea.findByIdAndDelete(id);
  if (!deletedArea) {
    return res.status(404).json(new GenericError(404, "Area not found"));
  }
  res
    .status(200)
    .json(new GenericReponse(200, "Area deleted successfully", {}));
});

export { addTransportationArea, deleteArea, getAreaById, getAreas, updateArea };
