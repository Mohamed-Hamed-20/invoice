import { response } from "express";
import userModel from "../../../DB/model/user.model.js";
import AggregationPipeline from "../../utils/apiFeature.js";
import cloudinary from "../../utils/cloudinary.js";
import { updatedImage, uploadImage } from "../../utils/cludinaryFunction.js";
import { asyncHandler, CustomError } from "../../utils/errorHandling.js";
import { hashpassword, verifypass } from "../../utils/hashPassword.js";
import { reSizeImage } from "../../utils/multer.js";
import { sanitizeUser } from "../../utils/sanitize.data.js";

export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, gender, birthdate } = req.body;

  const user = req.user;

  if (name && user.name !== name) {
    user.name = name;
  }

  if (email && user.email !== email) {
    const chkEmail = await userModel.findOne({ email });
    if (chkEmail) {
      return next(new Error("Email is Already Exist", { cause: 400 }));
    }
    user.email = email;
  }

  if (phone && user.phone !== phone) {
    const chkPhone = await userModel.findOne({ email });
    if (chkPhone) {
      return next(new Error("phone is Already Exist", { cause: 400 }));
    }
    user.phone = phone;
  }

  if (gender && user.gender !== gender) {
    user.gender = gender;
  }

  if (birthdate && user.birthdate !== birthdate) {
    user.birthdate = birthdate;
  }

  const newUserData = await user.save();

  return res.status(200).json({
    message: "User Data Updated",
    user: sanitizeUser(newUserData),
  });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const matched = await verifypass({
    password: oldPassword,
    hashpassword: req.user.password,
  });

  if (!matched) {
    return next(new Error("Invaild Old password", { cause: 400 }));
  }

  const newhashPasswoed = await hashpassword({
    password: newPassword,
    saltRound: Number.parseInt(process.env.salt_Round),
  });

  req.user.password = newhashPasswoed;

  const userUpdated = await req.user.save();

  // RESPONSE
  return res
    .status(200)
    .json({ message: "Password Changed", user: sanitizeUser(userUpdated) });
});

export const searchUser = asyncHandler(async (req, res, next) => {
  const allowFields = [
    "name",
    "email",
    "phone",
    "gender",
    "birthdate",
    "imgUrl",
    "role",
  ];

  const createPipeline = new AggregationPipeline(
    req.query,
    allowFields,
    allowFields
  );

  const Pipeline = createPipeline.build();

  const users = await userModel.aggregate(Pipeline);

  return res.status(200).json({ message: "successfully", users });
});

export const changeProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError("Image Not provided", 400));
  }

  const buffer = await reSizeImage({
    file: req.file,
    height: 600,
    width: 600,
    quality: 80,
  });

  let public_id, secure_url;

  if (req.user?.public_id) {
    const response = await updatedImage({
      buffer: buffer,
      user: req.user,
    });
    public_id = response.public_id;
    secure_url = response.secure_url;
  } else {
    const customId = `${req.user.name}-${req.user._id}`;
    const folder = `${process.env.folderName}/${process.env.Folder_user}/${customId}`;
    const response = await uploadImage({ buffer, folder });
    public_id = response.public_id;
    secure_url = response.secure_url;
  }

  req.user.imgUrl = secure_url;
  req.user.public_id = public_id;

  const user = await req.user.save();

  return res.status(200).json({
    message: "Profile image updated successfully",
    user: sanitizeUser(user),
  });
});

export const info = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json({
      message: `welcome ${req.user.name}`,
      user: sanitizeUser(req.user),
    });
});
