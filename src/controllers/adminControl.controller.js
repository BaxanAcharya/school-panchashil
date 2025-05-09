import { UPGRADE_CLASS } from "../constant.js";
import { AdminControl } from "../models/admin-control.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { handleAsync } from "../utils/handleAsync.js";

const addAdminControl = handleAsync(async (req, res) => {
  const { uuid } = req.query;

  const { active } = req.body;

  if (!uuid) {
    return res.status(400).json(new GenericError(400, "Please provide uuid."));
  }
  if (uuid !== process.env.UUID) {
    return res.status(400).json(new GenericError(400, "Invalid uuid."));
  }

  if (active === undefined || typeof active !== "boolean") {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide active status."));
  }

  const isExist = await AdminControl.findOne({
    func: UPGRADE_CLASS,
  });

  try {
    if (isExist) {
      const updated = await AdminControl.findByIdAndUpdate(
        isExist._id,
        {
          active,
        },
        {
          new: true,
        }
      );
      return res.status(200).json(
        new GenericReponse(200, "Admin control updated successfully", {
          result: updated,
        })
      );
    } else {
      const created = await AdminControl.create({
        func: UPGRADE_CLASS,
        active,
      });
      return res.status(201).json(
        new GenericReponse(201, "Admin control created successfully", {
          result: created,
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(new GenericError(500, error));
  }
});

const getAdminControl = handleAsync(async (req, res) => {
  const { uuid } = req.query;

  if (!uuid) {
    return res.status(400).json(new GenericError(400, "Please provide uuid."));
  }
  if (uuid !== process.env.UUID) {
    return res.status(400).json(new GenericError(400, "Invalid uuid."));
  }

  try {
    const adminControl = await AdminControl.findOne({
      func: UPGRADE_CLASS,
    });
    if (!adminControl) {
      return res
        .status(404)
        .json(new GenericError(404, "Admin control not found"));
    }
    return res
      .status(200)
      .json(
        new GenericReponse(
          200,
          "Admin control fetched successfully",
          adminControl
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while fetching admin control"));
  }
});

export { addAdminControl, getAdminControl };
