import jwt from "jsonwebtoken";
import { PASSWORD, REFRESH_TOKEN } from "../constant.js";
import { Admin } from "../models/admin.model.js";
import { GenericError } from "../utils/GenericError.js";
import { handleAsync } from "../utils/handleAsync.js";

export const verifyJWT = handleAsync(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json(new GenericError(401, "NOT AUTHORIZED"));
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const loggedAdmin = Admin.findById(decodedToken?._id).select(
      `-${PASSWORD} -${REFRESH_TOKEN}`
    );
    if (!loggedAdmin)
      return res
        .status(401)
        .json(new GenericError(401, "Invalid access token"));
    req.admin = decodedToken?._id;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(new GenericError(401, error?.message || "Invalid access token"));
  }
});
