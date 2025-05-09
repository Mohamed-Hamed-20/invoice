import dotenv from "dotenv";
import userModel from "../../DB/model/user.model.js";
import { asyncHandler } from "../utils/errorHandling.js";
import { verifyToken } from "../utils/token.js"; // Assuming verifyToken is imported from utils

export const roles = {
  user: "user",
  admin: "admin",
};

dotenv.config();

export const isAuth = (allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    const accessToken = req.headers.authorization;
    const refreshToken = req.headers["refresh-token"];

    // Check if tokens are provided
    if (!accessToken || !refreshToken) {
      return next(
        new Error("Please login . Access & Refresh token Required.", {
          cause: 400,
        })
      );
    }

    // Check if access token starts with the correct prefix
    if (!accessToken.startsWith(process.env.ACCESS_TOKEN_STARTWITH)) {
      return next(new Error("Invalid token prefix", { cause: 400 }));
    }

    // Extract token by splitting at the prefix
    const token = accessToken.split(process.env.ACCESS_TOKEN_STARTWITH)[1];
    // console.log(token);

    try {
      // Verify token
      const decoded = verifyToken({
        token: token,
        signature: process.env.ACCESS_TOKEN_SECRET,
      });

      // Validate decoded token payload
      if (!decoded.userId || !decoded.role || !decoded.IpAddress) {
        return next(new Error("Invalid token payload", { cause: 400 }));
      }

      // Check if IP address matches
      // if (decoded.IpAddress !== req.ip) {
      //   return next(
      //     new Error("Invalid IP address, please login again", { cause: 401 })
      //   );
      // }

      // Find user by ID
      const user = await userModel.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found", { cause: 404 }));
      }

      // Check if user has the required role
      if (!allowedRoles.includes(user.role)) {
        return next(
          new Error("Unauthorized to access This API", { cause: 401 })
        );
      }

      // Attach user to request object
      req.user = user;
      return next();
    } catch (error) {
      // Handle errors
      const message = error.message.includes("jwt expired")
        ? "Session Expired"
        : error.message;
      return next(new Error(message, { cause: 400 }));
    }
  });
};
