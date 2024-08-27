import joi from "joi";
import { Types } from "mongoose";

// Define request fields for validation
const requestFields = ["body", "params", "query", "headers"];

// Middleware to handle validation
export const valid = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    requestFields.forEach((field) => {
      if (schema[field]) {
        const { error, value } = schema[field].validate(req[field], {
          abortEarly: false,
        });

        if (error) {
          error.details.forEach((detail) => {
            validationErrors.push({
              message: detail.message.replace(/\"/g, ""),
              path: detail.path[0],
              label: detail.context.label,
              type: detail.type,
            });
          });
        } else {
          req[field] = value; // Update the request with validated data
        }
      }
    });

    // vaildation error
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "ERROR vaildation",
        statusCode: 400,
        validationErrors,
      });
    }

    return next();
  };
};

//============================= validatioObjectId =====================
const validateObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? value
    : helper.message("Invalid {#label} ");
};

export const toLowerCase = (value, helper) => {
  if (typeof value !== "string") {
    return helper.message("Invalid {#label}: not a string");
  }
  return value.toLowerCase();
};

export const customMessages = {
  "string.base": "{#label} must be a string",
  "string.min": "{#label} must be at least {#limit} characters",
  "string.max": "{#label} must be at most {#limit} characters",
  "number.base": "{#label} must be a number",
  "number.valid": "{#label} must be one of {#valids}",
  "boolean.base": "{#label} must be a boolean True or false",
  "array.base": "{#label} must be an array",
  "array.items": "Invalid item in {#label}",
  "_id.required": "{#label} is required",
  "_id.optional": "{#label} is optional",
  "any.only": "{#label} must be {#valids}",
  "any.required": "{#label} is required",
};

//======================general Validation Fields========================
export const generalFields = {
  name: joi
    .string()
    .min(3)
    .max(70)
    .lowercase()
    .trim()
    .regex(/^[a-zA-Z\s]+$/)
    .messages({
      "string.pattern.base": "name regex fail",
    })
    .messages(customMessages),

  email: joi
    .string()
    .email({ tlds: { allow: ["com", "net", "org"] } })
    .trim()
    .lowercase()
    .messages(customMessages),

  password: joi
    .string()
    .regex(/^[a-zA-Z0-9]{8,}$/)
    .trim()
    .messages({
      "string.pattern.base": "Password regex fail",
    })
    .messages(customMessages),

  _id: joi.string().trim().custom(validateObjectId).messages(customMessages),

  PhoneNumber: joi
    .string()
    .pattern(/^[0-9]{11}$/)
    .trim()
    .messages(customMessages),

  gender: joi
    .string()
    .valid("male", "female")
    .lowercase()
    .trim()
    .messages(customMessages),

  date: joi.date().iso().messages(customMessages),

  sort: joi.string().trim().optional().messages(customMessages),
  select: joi
    .string()
    .trim()
    .min(3)
    .max(100)
    .optional()
    .messages(customMessages),
  page: joi.number().min(0).max(33).optional().messages(customMessages),
  size: joi.number().min(0).max(23).optional().messages(customMessages),
  search: joi.string().trim().min(0).max(100).messages(customMessages),

  file: joi.object({
    size: joi.number(),
  }),
};
