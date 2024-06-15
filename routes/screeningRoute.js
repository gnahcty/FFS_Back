import express from "express";
import {
  addScreening,
  getFestivalDateRange,
  getScreeningsByDate,
  getScreeningsById,
} from "../controllers/screening.js";

const router = express.Router();

router.post("/", addScreening);
router.get("/FFDate", getFestivalDateRange);
router.get("/date/:date", getScreeningsByDate);
router.get("/:id", getScreeningsById);
export default router;
