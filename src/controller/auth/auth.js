import GoogleAuth from "../../utils/googleAuth.js";
import userModel from "../../../DB/model/user.model.js";
import { roles } from "../../middleware/auth.js";
import { env } from "../../utils/env.js";
import { asyncHandler, CustomError } from "../../utils/errorHandling.js";
import { hashpassword, verifypass } from "../../utils/hashPassword.js";
import { sanitizeUser } from "../../utils/sanitize.data.js";
import { sendCode, sendconfirmEmail } from "../../utils/sendEmail.js";
import {
  generateToken,
  storeRefreshToken,
  verifyToken,
} from "../../utils/token.js";
import { randomPass } from "../../utils/random.js";
import TokenModel from "../../../DB/model/token.model.js";

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"];

  // get user frm DB
  const user = await userModel
    .findOne({ $or: [{ email: email }, { phone: email }] }) // corrected query syntax
    .lean()
    .select(
      "name email password phone gender birthdate role isconfrimed Agents Activecode"
    );

  // if not user
  if (!user) {
    const error = new Error("Invalid Email or password");
    error.cause = 400;
    return next(error);
  }

  // verify password
  const matched = await verifypass({
    password: password,
    hashpassword: user.password,
  });

  // if invaild password
  if (!matched) {
    const error = new Error("Invalid Email or password");
    error.cause = 400;
    return next(error);
  }

  // Email not confirmed
  if (!user.isconfrimed) {
    const error = new Error("you need to confirm your email");
    error.cause = 400;
    return next(error);
  }

  // if its new agent
  if (!user.Agents.includes(userAgent)) {
    return next(
      new Error("You are trying to log in from a new device", { cause: 401 })
    );
  }

  //generate refresh token
  const refreshToken = await generateToken({
    payload: {
      userId: user._id,
      userAgent,
      role: user.role,
      IpAddress: req.ip,
    },
    signature: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_ExpireIn,
  });

  // store ref tokens
  const storepromice = storeRefreshToken(refreshToken, user._id, next);

  //generate access token
  const accessTokenpromice = generateToken({
    payload: {
      userId: user._id,
      userAgent,
      role: user.role,
      IpAddress: req.ip,
    },
    signature: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: process.env.accessExpireIn,
  });

  const [stored, accessToken] = await Promise.all([
    storepromice,
    accessTokenpromice,
  ]);

  // Set cookies
  // res.cookie("accessToken", accessToken, {
  //   httpOnly: true,
  //   secure: process.env.MOOD === env.prod,
  //   sameSite: "strict",
  //   maxAge: 1 * 3600 * 1000, // 1 hour
  // });

  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   secure: process.env.MOOD === env.prod,
  //   sameSite: "strict",
  //   maxAge: 5 * 24 * 3600 * 1000, // 5 days
  // });

  return res.json({
    message: "Login successfully",
    user: sanitizeUser(user),
    tokens: { accessToken, refreshToken },
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const key = req.params.token;
  const userAgent = req.headers["user-agent"];

  const decode = await verifyToken({
    token: key,
    signature: process.env.DEFAULT_SIGNATURE,
  });

  if (!decode || !decode.userId) {
    return next(new Error("Invaild Key or payload", { cause: 400 }));
  }

  const user = await userModel
    .findByIdAndUpdate(
      { _id: decode.userId },
      { isconfrimed: true, $addToSet: { Agents: userAgent } },
      { new: true }
    )
    .lean()
    .select(
      "name email password phone gender birthdate role isconfrimed Agents Activecode"
    );

  if (!user) {
    return next(new Error("SERVER ERROR :(", { cause: 500 }));
  }

  //generate acess token
  const accessToken = await generateToken({
    payload: { userId: user._id, userAgent, IpAddress: req.ip },
    signature: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: process.env.accessExpireIn,
  });

  //generate refresh token
  const refreshToken = await generateToken({
    payload: { userId: user._id, userAgent, IpAddress: req.ip },
    signature: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_ExpireIn,
  });

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.MOOD === env.prod,
    sameSite: "strict",
    maxAge: 1 * 3600 * 1000, // 1 hour
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.MOOD === env.prod,
    sameSite: "strict",
    maxAge: 5 * 24 * 3600 * 1000, // 5 days
  });

  return res.json({ message: "Login successfully", user: sanitizeUser(user) });
});

/**
 * @desc    Send verification code to user email or phone
 * @route   POST /api/v1/auth/sendverifyCode
 * @access  Public
 */

export const sendVerifyCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Find user by email or phone
  const user = await userModel
    .findOne({ $or: [{ email }, { phone: email }] })
    .select("name email phone Activecode");
  // If user not found, throw error
  if (!user) {
    return next(new Error("Invalid Email or Phone", { cause: 400 }));
  }

  // Generate and send verification code
  const code = await sendCode({ name: user.name, email: user.email });

  // If code sending fails, throw server error
  if (!code) {
    return new CustomError(
      "SERVER ERROR: Unable to send email, try later",
      500
    );
  }

  // Update user with the new active code
  user.Activecode = code;

  const updatedUser = await user.save();

  // If user update fails, throw server error
  if (!updatedUser) {
    return new CustomError("SERVER ERROR: Unable to update user", 500);
  }

  // Send success response
  return res.status(200).json({ message: "Code sent successfully" });
});

export const verifySendcode = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;
  const userAgent = req.headers["user-agent"];

  // Find user by email or phone
  const user = await userModel
    .findOne({ $or: [{ email }, { phone: email }] })
    .select("email phone Activecode")
    .lean();

  // If user not found, throw error
  if (!user) {
    return next(new Error("Invalid Email or Phone", { cause: 400 }));
  }

  if (!user.Activecode || user.Activecode !== code) {
    return next(new Error("Invaild Code", { cause: 400 }));
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    { _id: user._id },
    {
      isconfrimed: true,
      $addToSet: { Agents: userAgent },
      $unset: { Activecode: "" },
    },
    { new: true }
  );

  // If user update fails, throw server error
  if (!updatedUser) {
    return new CustomError("SERVER ERROR: Unable to update user", 500);
  }

  // Send success response
  return res.status(200).json({ message: "verifiyed Successfully" });
});

// generate url auth
export const googleUrlAuth = asyncHandler(async (req, res, next) => {
  const googleAuth = new GoogleAuth();
  const url = await googleAuth.generateAuthUrl();
  return res.status(200).json({ message: " url created successfully ", url });
});

export const googleCallBack = asyncHandler(async (req, res, next) => {
  const code = req.query.code;
  const userAgent = req.headers["user-agent"];

  //Google auth
  const googleAuth = new GoogleAuth();
  const googleUser = await googleAuth.getUserInfo(code);

  if (!googleUser?.email || !googleUser?.verified_email) {
    return next(new Error("Invaild Social login", { cause: 400 }));
  }

  let user = await userModel.findOne({ email: googleUser.email });

  if (!user) {
    return next(new Error("User Not found In system!", { cause: 404 }));
  }

  //generate acess token
  const accessToken = await generateToken({
    payload: { userId: user._id, userAgent, IpAddress: req.ip },
    signature: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: process.env.accessExpireIn,
  });

  //generate refresh token
  const refreshToken = await generateToken({
    payload: { userId: user._id, userAgent, IpAddress: req.ip },
    signature: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_ExpireIn,
  });

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.MOOD === env.prod,
    sameSite: "strict",
    maxAge: 1 * 3600 * 1000, // 1 hour
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.MOOD === env.prod,
    sameSite: "strict",
    maxAge: 5 * 24 * 3600 * 1000, // 5 days
  });

  // Send JSON response with tokens and user data
  return res.status(200).json({
    message: "Login successfully",
    tokens: { accessToken, refreshToken },
    user: sanitizeUser(user),
    googleUser,
  });

  //   res.redirect(
  //     `${process.env.Front_End}/?user=${encodeURIComponent(
  //       JSON.stringify(sanitizeUser(user))
  //     )}`
  //   );
});

export const refreshSessionTokens = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.body;

  let decodedToken;

  // Verify the refresh token
  try {
    decodedToken = await verifyToken({
      token: refreshToken,
      signature: process.env.REFRESH_TOKEN_SECRET, // Corrected the spelling from ENCRPTION to ENCRYPTION
    });
  } catch (error) {
    const message = error.message.includes("jwt expired")
      ? "Please log in again."
      : error.message;
    return next(new Error(message, { cause: 400 }));
  }

  // Validate decoded token payload
  if (
    !decodedToken ||
    !decodedToken.userId ||
    !decodedToken.role ||
    !decodedToken.IpAddress
  ) {
    return next(new Error("Invalid token payload", { cause: 400 }));
  }

  // Verify user and refresh token
  const user = await TokenModel.findOne({
    refreshTokens: { $in: refreshToken },
    isvalid: true,
    userId: decodedToken.userId,
  }).lean();

  if (!user) {
    return next(
      new Error("Invalid refresh token or user not found", { cause: 404 })
    );
  }

  // Generate a new access token
  const newAccessToken = await generateToken({
    payload: {
      userId: decodedToken.userId,
      role: decodedToken.role,
      IpAddress: req.ip,
    },
    signature: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: process.env.ACCESS_EXPIRE_IN, // Ensure environment variables are named correctly and consistently
  });

  if (!newAccessToken) {
    return next(new Error("Failed to generate access token", { cause: 500 }));
  }

  // Respond with the new tokens
  return res.status(200).json({
    message: "Token refreshed successfully",
    accessToken: newAccessToken,
    refreshToken, // No need to send back refresh token if it's not updated
  });
});
