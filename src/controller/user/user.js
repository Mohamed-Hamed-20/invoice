import userModel from "../../../DB/model/user.model.js";
import AggregationPipeline from "../../utils/apiFeature.js";
import { asyncHandler } from "../../utils/errorHandling.js";

export const updateUser = asyncHandler((req, res, next) => {});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { name, email, phone, gender, birthdate } = req.body;

  if (condition) {
  }
});
export const searchUser = asyncHandler(async (req, res, next) => {
  const allowFields = [
    "name",
    "email",
    "phone",
    "gender",
    "birthdate",
    "imgUrl",
    "role",
  ];

  const createPipeline = new AggregationPipeline(
    req.query,
    allowFields,
    allowFields
  );

  const Pipeline = createPipeline.build();

  const users = await userModel.aggregate(Pipeline);

  return res.status(200).json({ message: "successfully", users });
});
