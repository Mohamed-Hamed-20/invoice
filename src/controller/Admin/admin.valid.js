import joi from "joi";
import { generalFields } from "../../middleware/vaildation.js";

export const createUser = {
  body: joi
    .object({
      name: generalFields.name.required(),
      email: generalFields.email.required(),
      password: generalFields.password.required(),
      cpassword: joi.string().valid(joi.ref("password")).required(),
      phone: generalFields.PhoneNumber.optional(),
      gender: generalFields.gender.optional(),
      birthdate: generalFields.date.optional(),
    })
    .required(),
};

export const updateUser = {
  body: joi
    .object({
      name: generalFields.name.optional(),
      email: generalFields.email.optional(),
      phone: generalFields.PhoneNumber.optional(),
      gender: generalFields.gender.optional(),
      birthdate: generalFields.date.optional(),
    })
    .required(),

  query: joi
    .object({
      userId: generalFields._id.required(),
    })
    .required(),
};

export const deleteUser = {
  query: joi
    .object({
      userId: generalFields._id.required(),
    })
    .required(),
};
