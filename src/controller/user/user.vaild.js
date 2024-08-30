import joi from "joi";
import { generalFields } from "../../middleware/vaildation.js";

export const updatedUser = {
  body: joi
    .object({
      name: generalFields.name.optional(),
      email: generalFields.email.optional(),
      phone: generalFields.PhoneNumber.optional(),
      gender: generalFields.gender.optional(),
      birthdate: generalFields.date.optional(),
    })
    .required(),
};

export const searchuser = {
  query: joi
    .object({
      sort: generalFields.sort,
      select: generalFields.select,
      page: generalFields.page,
      size: generalFields.size,
      search: generalFields.search,
    })
    .required(),
};

export const changePassword = {
  body: joi
    .object({
      oldPassword: generalFields.password.required(),
      newPassword: generalFields.password
        .invalid(joi.ref("oldPassword"))
        .required()
        .messages({
          "any.invalid": "{#label} must not be the same as oldPassword",
        }),
      cpassword: joi.string().trim().valid(joi.ref("newPassword")).required(),
    })
    .required(),
};
