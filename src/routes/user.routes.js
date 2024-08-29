import express from "express";
import * as Uc from "../controller/user/user.js";

const router = express.Router();




// router.patch("/user/update", )

router.get("/get/users", Uc.searchUser);
export default router;
