import { Class } from "../models/class.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  validateClassName,
  validateSection,
} from "../validation/class.validation.js";

const addClass = handleAsync(async (req, res) => {
  const { name, section } = req.body;
  const nameValidation = validateClassName(name);
  if (nameValidation) {
    return res.status(400).json(new GenericError(400, nameValidation));
  }

  const sectionValidation = validateSection(section);
  if (sectionValidation) {
    return res.status(400).json(new GenericError(400, sectionValidation));
  }

  const exists = await Class.findOne({
    name,
    section,
  });

  if (exists) {
    return res
      .status(409)
      .json(
        new GenericError(
          409,
          `Class already exists with name ${name} and section ${section}`
        )
      );
  }
  const savedClass = await Class.create({ name, section });
  if (!savedClass) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while saving class."));
  }
  return res
    .status(201)
    .json(new GenericReponse(201, "Class Created SuccessFully", savedClass));
});

const getAllClasses = handleAsync(async (_, res) => {
  const classes = await Class.find();
  if (!classes) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching classes."));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Classes Fetched SuccessFully", classes));
});

const updateClass = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { name, section } = req.body;
  const nameValidation = validateClassName(name);
  if (nameValidation) {
    return res.status(400).json(new GenericError(400, nameValidation));
  }

  const sectionValidation = validateSection(section);
  if (sectionValidation) {
    return res.status(400).json(new GenericError(400, sectionValidation));
  }

  const exists = await Class.findOne({
    name,
    section,
  });

  if (exists) {
    return res
      .status(409)
      .json(
        new GenericError(
          409,
          `Class already exists with name ${name} and section ${section}`
        )
      );
  }
  const updatedClass = await Class.findByIdAndUpdate(
    id,
    { name, section },
    { new: true }
  );
  if (!updatedClass) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while updating class."));
  }
  return res
    .status(201)
    .json(new GenericReponse(201, "Class Updated SuccessFully", updatedClass));
});

const getClassById = handleAsync(async (req, res) => {
  const { id } = req.params;
  const classById = await Class.findById(id);
  if (!classById) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching class."));
  }
  return res
    .status(201)
    .json(new GenericReponse(201, "Class Fetched SuccessFully", classById));
});

export { addClass, getAllClasses, getClassById, updateClass };
