import jwt from "jsonwebtoken";
import { CustomError } from "./errorHandling.js";
import TokenModel from "../../DB/model/token.model.js";
// import TokenModel from "../../DB/models/token.model.js";

export const generateToken = async ({
  payload = {},
  signature = process.env.DEFAULT_SIGNATURE,
  expiresIn = "1d",
} = {}) => {
  try {
    // check if the payload is empty object
    if (!Object.keys(payload).length) {
      throw new Error("can't generate token without payload");
    }
    const token = jwt.sign(payload, signature, { expiresIn });
    if (!token) {
      throw new Error("Faild to geneerate token");
    }
    return token;
  } catch (error) {
    throw new Error(error);
  }
};

export const verifyToken = ({
  token,
  signature = process.env.DEFAULT_SIGNATURE,
} = {}) => {
  try {
    // check if the payload is empty object
    if (!token) {
      throw new Error("Error in verify Token Not found");
    }
    const data = jwt.verify(token, signature);
    if (!data) {
      throw new Error("Error in verify Token");
    }
    return data;
  } catch (error) {
    // throw new CustomError("Invalid verify token", 400);
    throw new CustomError(error.message, 400);
  }
};

export const storeRefreshToken = async (refreshToken, userId, next) => {
  try {
    // Find the token document by userId
    let tokenDoc = await TokenModel.findOne({ userId, isvalid: true }).lean();

    if (tokenDoc) {
      // Ensure the token array does not exceed the maximum limit
      if (tokenDoc.refreshTokens.length >= 4) {
        tokenDoc.refreshTokens.shift(); // Remove the oldest token
      }

      // Add the new refresh token
      tokenDoc.refreshTokens.push(refreshToken);

      // Update the existing document
      const result = await TokenModel.findByIdAndUpdate(
        tokenDoc._id,
        { refreshTokens: tokenDoc.refreshTokens },
        { new: true }
      );

      if (!result) {
        throw new Error("Failed to update refresh token");
      }
    } else {
      // Create a new token document if none exists
      const result = await TokenModel.create({
        userId,
        refreshTokens: [refreshToken],
        isvalid: true,
      });

      if (!result) {
        throw new Error("Failed to create refresh token");
      }
    }

    return true;
  } catch (error) {
    // Handle errors and pass them to the next middleware
    if (next) {
      return next(new Error(error.message));
    } else {
      throw error;
    }
  }
};
