import userModel from "../../../DB/model/user.model.js";
import { roles } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/errorHandling.js";
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
