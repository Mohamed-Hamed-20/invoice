import express from "express";
import * as Uc from "../controller/user/user.js";
import * as Vc from "../controller/user/user.vaild.js";

import { isAuth, roles } from "../middleware/auth.js";
import { valid } from "../middleware/vaildation.js";

const router = express.Router();

//update user
router.patch(
  "/user/update",
  valid(Vc.updatedUser),
  isAuth([roles.admin, roles.user]),
  Uc.updateUser
);

//change password
router.patch(
  "/user/change/password",
  valid(Vc.changePassword),
  isAuth([roles.admin, roles.user]),
  Uc.changePassword
);

// Search users
router.get(
  "/get/users",
  valid(Vc.searchuser),
  isAuth([roles.admin]),
  Uc.searchUser
);

export default router;
