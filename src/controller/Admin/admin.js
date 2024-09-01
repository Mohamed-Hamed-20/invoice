import mongoose from "mongoose";
import TokenModel from "../../../DB/model/token.model.js";
import userModel from "../../../DB/model/user.model.js";
import { roles } from "../../middleware/auth.js";
import { asyncHandler, CustomError } from "../../utils/errorHandling.js";
import { hashpassword } from "../../utils/hashPassword.js";
import { sanitizeUser } from "../../utils/sanitize.data.js";
import { sendconfirmEmail } from "../../utils/sendEmail.js";

export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, gender, birthdate } = req.body;
  const userAgent = req.headers["user-agent"];

  const check = await userModel.findOne({ $or: [{ email }, { phone }] });

  // check if email or phone is duplicated
  if (check) {
    let message = "";
    check.phone === phone
      ? (message = "phone number Is Already Exist")
      : (message = "Email Is Already Exist");
    return next(new Error(message, { cause: 400 }));
  }

  // hash password
  const newPassword = await hashpassword({
    password,
    saltRound: parseInt(process.env.salt_Round),
  });

  const user = new userModel({
    name: name,
    email,
    password: newPassword,
    phone: phone,
    gender: gender,
    birthdate: birthdate,
    role: roles.user,
    isconfrimed: true,
    Agents: [userAgent],
  });

  //   // send confirm email
  //   let frontEndURL = req.headers.referer;
  //   const link = `${frontEndURL}confirmEmail`;
  //   const sendedPromise = sendconfirmEmail(user, link);

  // safe object data
  const userData = await user.save();

  //   const [userData] = await Promise.all([userPromise]);

  return !userData
    ? next(new Error("SERVER ERROR !", { code: 500 }))
    : res.status(201).json({
        message: "Account Created success",
        user: sanitizeUser(userData),
      });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, gender, birthdate } = req.body;

  const user = await userModel.findById(req.query.userId).exec();

  if (name && user.name !== name) user.name = name;

  if (email && user.email !== email) {
    const chkEmail = await userModel.findOne({ email });
    if (chkEmail) {
      return next(new Error("Email is Already Exist", { cause: 400 }));
    }
    user.email = email;
  }

  if (phone && user.phone !== phone) {
    const chkPhone = await userModel.findOne({ phone });
    if (chkPhone) {
      return next(new Error("phone is Already Exist", { cause: 400 }));
    }
    user.phone = phone;
  }

  if (gender && user.gender !== gender) user.gender = gender;

  if (birthdate && user.birthdate !== birthdate) user.birthdate = birthdate;

  const newUserData = await user.save();

  return res.status(200).json({
    message: "User Data Updated",
    user: sanitizeUser(newUserData),
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.query;

  const session = await mongoose.startSession();
  session.startTransaction();

  const user = await userModel.findByIdAndDelete(userId, { session });

  if (!user) {
    await session.abortTransaction();
    session.endSession();
    return next(new Error("Invalid UserId", { cause: 400 }));
  }

  await TokenModel.findByIdAndDelete(userId, { session });

  await session.commitTransaction();
  session.endSession();
  return res
    .status(200)
    .json({ message: "deleted successfully", user: sanitizeUser(user) });
});
