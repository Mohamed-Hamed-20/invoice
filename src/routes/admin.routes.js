import express from "express";
import { isAuth, roles } from "../middleware/auth.js";
import * as Ac from "../controller/Admin/admin.js";
import * as Vs from "../controller/Admin/admin.valid.js";
import { valid } from "../middleware/vaildation.js";
const router = express.Router();

router.post(
  "/create/user",
  valid(Vs.createUser),
  isAuth([roles.admin]),
  Ac.createUser
);

export default router;
