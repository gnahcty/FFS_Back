import express from "express";
import * as auth from "../middlewares/auth.js";
import { addToList, getListsByUser } from "../controllers/list.js";

const router = express.Router();

router.post("/", auth.jwt, addToList);
router.get("/", auth.jwt, getListsByUser);

export default router;
