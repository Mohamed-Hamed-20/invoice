import { env } from "./env.js";

export const asyncHandler = (controller) => {
  return (req, res, next) => {
    controller(req, res, next).catch(async (error) => {
      const validStatusCode =
        error.cause &&
        Number.isInteger(error.cause) &&
        error.cause >= 100 &&
        error.cause < 600;
      const statusCode = validStatusCode ? error.cause : 500;

      let result = {};

      process.env.MOOD == env.DEV
        ? (result = { message: error.message, stack: error.stack, statusCode })
        : (result = {
            message: "something went wrong ! , SERVER ERROR ! :( ",
            statusCode,
          });

      return res.status(statusCode || 500).json(result);
    });
  };
};

export const GlobalErrorHandling = (error, req, res, next) => {
  let result = {};

  process.env.MOOD == env.DEV
    ? (result = {
        message: error.message,
        statusCode: error.cause,
        stack: error.stack,
      })
    : (result = { message: error.message, statusCode: error.cause });

  return res.status(error.cause || 500).json(result);
};

export class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
