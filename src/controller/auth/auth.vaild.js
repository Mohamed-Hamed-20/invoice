import joi from "joi";
import { generalFields } from "../../middleware/vaildation.js";

export const login = {
  body: joi.object({
    email: joi.string().trim().min(5).max(30).required(),
    password: generalFields.password.required(),
  }),
};

export const confirmEmail = {
  params: joi
    .object({
      token: joi.string().trim().min(7).max(222).required(),
    })
    .required(),
};

export const verifycode = {
  body: joi
    .object({
      email: joi.string().trim().min(7).max(222).required(),
    })
    .required(),
};

export const verifySendcode = {
  body: joi.object({
    email: joi.string().trim().min(7).max(222).required(),
    code: joi
      .string()
      .trim()
      .pattern(/^[0-9]{6}$/)
      .required(),
  }),
};

export const refreshSessionTokens = {
  body: joi.object({
    accessToken: joi.string()
      .trim()
      .min(7)
      .max(333)
      .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .required()
      .messages({
        "string.base": "Access Token should be a type of string.",
        "string.empty": "Access Token cannot be an empty field.",
        "string.min": "Access Token should have a minimum length of {#limit}.",
        "string.max": "Access Token should have a maximum length of {#limit}.",
        "string.pattern.base": "Access Token format is invalid.",
        "any.required": "Access Token is a required field.",
      }),
    refreshToken: joi.string()
      .trim()
      .min(7)
      .max(333)
      .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .required()
      .messages({
        "string.base": "Refresh Token should be a type of string.",
        "string.empty": "Refresh Token cannot be an empty field.",
        "string.min": "Refresh Token should have a minimum length of {#limit}.",
        "string.max": "Refresh Token should have a maximum length of {#limit}.",
        "string.pattern.base": "Refresh Token format is invalid.",
        "any.required": "Refresh Token is a required field.",
      }),
  }),
};
