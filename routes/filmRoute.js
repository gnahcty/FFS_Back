import express from "express";
import {
  addFilm,
  getFilmById,
  getCategories,
  getFilmByCategory,
  // getPicByCategory,
  getFirstPicsOfAllFilms,
} from "../controllers/film.js";

const router = express.Router();

router.post("/", addFilm);
router.get("/pics", getFirstPicsOfAllFilms);
// router.get("/pics/:category", getPicByCategory);
router.get("/categories", getCategories);
router.get("/films/:category", getFilmByCategory);
router.get("/:id", getFilmById);

export default router;
