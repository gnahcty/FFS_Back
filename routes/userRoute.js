import express from "express";
import contentType from "../middlewares/contentType.js";
import {
  createUser,
  login,
  logout,
  extend,
  getProfile,
  // modifyList,
} from "../controllers/user.js";
import * as auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/", createUser);
router.post("/login", contentType("application/json"), auth.login, login);
router.post("/logout", auth.jwt, logout);
router.patch("/extend", auth.jwt, extend);
router.get("/profile", auth.jwt, getProfile);
// router.post("/watchList", auth.jwt, modifyList);

export default router;
