import mongoose from "mongoose";
import { Class } from "../models/class.model.js";
import { Subject } from "../models/subject.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  handlePaginationParams,
  makePaginatedResponse,
} from "../utils/HandlePagination.js";
import {
  validateClassId,
  validateDisplayOrder,
  validateFullMarks,
  validateName,
} from "../validation/subject.validation.js";

const addSubject = handleAsync(async (req, res) => {
  const { name, fullMarks, displayOrder, class: classId } = req.body;

  const isNameValid = validateName(name);
  if (isNameValid) {
    return res.status(400).json(new GenericError(400, isNameValid));
  }

  const isFullMarksValid = validateFullMarks(fullMarks);
  if (isFullMarksValid) {
    return res.status(400).json(new GenericError(400, isFullMarksValid));
  }

  const isDisplayOrderValid = validateDisplayOrder(displayOrder);
  if (isDisplayOrderValid) {
    return res.status(400).json(new GenericError(400, isDisplayOrderValid));
  }

  const isClassIdValid = validateClassId(classId);
  if (isClassIdValid) {
    return res.status(400).json(new GenericError(400, isClassIdValid));
  }

  if (!mongoose.isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new GenericError(400, "Class id is not valid."));
  }

  const isClass = await Class.findById(classId);
  if (!isClass) {
    return res.status(404).json(new GenericError(404, "Class Not Found."));
  }

  const isSubject = await Subject.findOne({
    name: name.toUpperCase(),
    class: classId,
  });
  if (isSubject) {
    return res
      .status(400)
      .json(
        new GenericError(
          409,
          `Subject ${name.toUpperCase()} already exists for class ${
            isClass.name
          }.`
        )
      );
  }

  const subject = await Subject.create({
    name: name.toUpperCase(),
    fullMarks,
    displayOrder,
    class: classId,
  });
  if (!subject) {
    return res.status(500).json(new GenericError(500, error.message));
  }
  return res
    .status(201)
    .json(new GenericReponse(201, "Subject created successfully ", subject));
});

const getSubjects = handleAsync(async (req, res) => {
  const { options, dir } = handlePaginationParams(req);
  const matchQuery = {};

  if (req.query.name) {
    matchQuery.name = { $regex: req.query.name, $options: "i" }; // Case-insensitive search
  }

  if (req.query.class) {
    matchQuery.class = new mongoose.Types.ObjectId(req.query.class);
  }

  if (req.query.disabled !== undefined) {
    matchQuery.disabled = req.query.disabled === "true"; // or "false"
  }

  const subjects = await Subject.aggregatePaginate(
    Subject.aggregate([
      {
        $match: matchQuery,
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
          _id: 1,
          name: 1,
          displayOrder: 1,
          fullMarks: 1,
          classValues: 1, // Retain the classValues field
          disabled: 1,
        },
      },
      {
        $sort: {
          displayOrder: dir,
          disabled: -1,
        },
      },
    ]),
    options
  );
  if (!subjects) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching subjects."));
  }
  return res
    .status(200)
    .json(
      new GenericReponse(
        200,
        "Subjects fetched successfully",
        makePaginatedResponse(subjects, dir)
      )
    );
});

const getSubjectById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json(new GenericError(400, "Subject id is not valid."));
  }
  const subject = await Subject.aggregate([
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
  if (!subject[0]) {
    return res.status(404).json(new GenericError(404, "Subject not found"));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Subject fetched successfully", subject[0]));
});

const updateSubjectById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json(new GenericError(400, "Subject id is not valid."));
  }
  const { fullMarks, displayOrder } = req.body;

  const isFullMarksValid = validateFullMarks(fullMarks);
  if (isFullMarksValid) {
    return res.status(400).json(new GenericError(400, isFullMarksValid));
  }

  const isDisplayOrderValid = validateDisplayOrder(displayOrder);
  if (isDisplayOrderValid) {
    return res.status(400).json(new GenericError(400, isDisplayOrderValid));
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    id,
    {
      fullMarks,
      displayOrder,
    },
    { new: true }
  );
  if (!updatedSubject) {
    return res.status(404).json(new GenericError(404, "Subject not found"));
  }
  return res.status(200).json(new GenericReponse(200, "Subject updated", {}));
});

const deleteSubjectById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json(new GenericError(400, "Subject id is not valid."));
  }
  const deletedSubject = await Subject.findByIdAndDelete(id);
  if (!deletedSubject) {
    return res.status(404).json(new GenericError(404, "Subject not found"));
  }
  return res.status(200).json(new GenericReponse(200, "Subject deleted", {}));
});

const getSubjectByClassId = handleAsync(async (req, res) => {
  const { classId } = req.params;
  if (!mongoose.isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new GenericError(400, "Class id is not valid."));
  }

  const matchQuery = {
    class: new mongoose.Types.ObjectId(classId),
  };

 if (req.query.disabled === "false") {
  matchQuery.$or = [
    { disabled: false },
    { disabled: { $exists: false } },
  ];
} else if (req.query.disabled === "true") {
  matchQuery.disabled = true;
}
  const subjects = await Subject.aggregate([
    {
      $match: matchQuery,
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
    {
      $sort: {
        displayOrder: 1,
      },
    },
  ]);
  if (!subjects) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching subjects."));
  }
  return res
    .status(200)
    .json(new GenericReponse(200, "Subjects fetched successfully", subjects));
});

const tooggleSubjectById = handleAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json(new GenericError(400, "Subject id is not valid."));
  }
  const subject = await Subject.findById(id);
  if (!subject) {
    return res.status(404).json(new GenericError(404, "Subject not found"));
  }
  subject.disabled = !subject.disabled;
  await subject.save();
  return res
    .status(200)
    .json(new GenericReponse(200, "Subject updated successfully", subject));
});

export {
  addSubject,
  deleteSubjectById,
  getSubjectByClassId,
  getSubjectById,
  getSubjects,
  tooggleSubjectById,
  updateSubjectById,
};
