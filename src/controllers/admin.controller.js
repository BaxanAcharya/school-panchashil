import { ACCESS_TOKEN, COOKIE_OPTIONS, REFRESH_TOKEN } from "../constant.js";
import { Admin } from "../models/admin.model.js";
import { GenericError } from "../utils/GenericError.js";
import { GenericReponse } from "../utils/GenericResponse.js";
import { uplaodOnBucket } from "../utils/bucket.js";
import { handleAsync } from "../utils/handleAsync.js";
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from "../validation/admin.validation.js";

const generateAccessAndRefresToken = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new GenericError(500, "Error while generating tokens.");
  }
};

const addAdmin = handleAsync(async (req, res) => {
  const { fullName, email, password } = req.body;
  const fullNameValidation = validateFullName(fullName);
  if (fullNameValidation) {
    return res.status(400).json(new GenericError(400, fullNameValidation));
  }
  const emailValidation = validateEmail(email);
  if (emailValidation) {
    return res.status(400).json(new GenericError(400, emailValidation));
  }

  const passwordValidation = validatePassword(password, true);

  if (passwordValidation) {
    return res.status(400).json(new GenericError(400, passwordValidation));
  }

  const exists = await Admin.findOne({
    email,
  });
  if (exists) {
    return res
      .status(409)
      .json(
        new GenericError(
          409,
          `Admin already exists with email ${email.toLowerCase()}`
        )
      );
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

const loginAdmin = handleAsync(async (req, res) => {
  const { email, password } = req.body;
  const emailValidation = validateEmail(email);
  if (emailValidation) {
    return res.status(400).json(new GenericError(400, emailValidation));
  }
  const passwordValidation = validatePassword(password);
  if (passwordValidation) {
    return res.status(400).json(new GenericError(400, passwordValidation));
  }

  const emailAdmin = await Admin.findOne({
    email: email.toLowerCase(),
  });
  if (!emailAdmin) {
    return res.status(400).json(new GenericError(404, `Admin doesnot exist`));
  }

  const isPasswordCorrect = await emailAdmin.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return res.status(400).json(new GenericError(401, `Invalid credentials`));
  }
  const { accessToken, refreshToken } = await generateAccessAndRefresToken(
    emailAdmin._id
  );

  emailAdmin.refreshToken = undefined;
  emailAdmin.password = undefined;
  return res
    .status(200)
    .cookie(ACCESS_TOKEN, accessToken, COOKIE_OPTIONS)
    .cookie(REFRESH_TOKEN, refreshToken, COOKIE_OPTIONS)
    .json(
      new GenericReponse(200, "Admin Logged In", {
        admin: emailAdmin,
        accessToken,
        refreshToken,
      })
    );
});

const logoutAdmin = handleAsync(async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(
    req?.admin,
    {
      refreshToken: null,
    },
    { new: true }
  );

  console.log(admin);
  res
    .status(200)
    .clearCookie(ACCESS_TOKEN, COOKIE_OPTIONS)
    .clearCookie(REFRESH_TOKEN, COOKIE_OPTIONS)
    .json(new GenericReponse(200, "User Logged Out", {}));
});

export { addAdmin, loginAdmin, logoutAdmin };
