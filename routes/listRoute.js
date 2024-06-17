import express from "express";
import * as auth from "../middlewares/auth.js";
import {
  addToList,
  getListsByUser,
  hideList,
  unhideList,
  lockList,
  unlockFilm,
} from "../controllers/list.js";

const router = express.Router();

router.post("/add", auth.jwt, addToList);
router.get("/", auth.jwt, getListsByUser);
router.post("/hide", auth.jwt, hideList);
router.post("/unhide", auth.jwt, unhideList);
router.post("/lock", auth.jwt, lockList);
router.post("/unlock", auth.jwt, unlockFilm);

export default router;
