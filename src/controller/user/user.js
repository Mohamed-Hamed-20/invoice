import userModel from "../../../DB/model/user.model.js";
import AggregationPipeline from "../../utils/apiFeature.js";
import { asyncHandler } from "../../utils/errorHandling.js";
import { hashpassword, verifypass } from "../../utils/hashPassword.js";
import { sanitizeUser } from "../../utils/sanitize.data.js";

export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, gender, birthdate } = req.body;

  const user = req.user;

  if (name && user.name !== name) {
    user.name = name;
  }

  if (email && user.email !== email) {
    user.email = email;
  }

  if (phone && user.phone !== phone) {
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
