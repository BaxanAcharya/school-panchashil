import { Admin } from "../models/admin.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { uplaodOnBucket } from "../utils/bucket.js";
import { handleAsync } from "../utils/handleAsync.js";

const addAdmin = handleAsync(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName) {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide a fullName."));
  }
  if (!email) {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide an email."));
  }
  //check for valid email
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide valid an email."));
  }
  if (!password) {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide a password."));
  }

  //strong password
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{7,}$/;

  //password example: 1234567a
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json(
        new GenericError(
          400,
          "Please provide a strong password. Password must contain minimum seven characters, at least one letter and one number."
        )
      );
  }

  const exists = await Admin.findOne({
    email,
  });
  if (exists) {
    return res
      .status(409)
      .json(new GenericError(409, `Admin already exists with email ${email}`));
  }

  const fileLocalPath = req?.file?.path;
  if (!fileLocalPath) {
    return res
      .status(400)
      .json(new GenericError(400, "Please provide thumbnail."));
  }

  const fileResponse = await uplaodOnBucket(fileLocalPath);
  if (!fileResponse) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while uploading thumbnail."));
  }

  const savedAdmin = await Admin.create({
    fullName,
    email,
    password,
    thumbnail: fileResponse || "",
  });

  savedAdmin.password = undefined;
  savedAdmin.refreshToken = undefined;

  if (!savedAdmin) {
    return res
      .status(500)
      .json(new GenericError(500, "Error while creating admin."));
  }

  res
    .status(201)
    .json(new GenericReponse(201, "Admin created successfully.", savedAdmin));
});

export { addAdmin };
