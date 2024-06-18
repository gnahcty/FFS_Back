import { StatusCodes } from "http-status-codes";
import Film from "../models/filmSchema.js";
import { getMessageFromValidationError } from "../utils/HandleMongooseError.js";

export const addFilm = async (req, res) => {
  try {
    await Film.create(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    // 欄位錯誤
    if (error.name === "ValidationError") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: getMessageFromValidationError(error),
      });
    } else if (error.name === "MongoServerError" && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "電影已存在",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "internal server error",
      });
    }
  }
};

export const getFilmById = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      result: film,
    });
    if (!film) throw new Error("此id查無電影");
  } catch (error) {
    console.error("Error getting film by id:", error.message);
    // id格式錯誤
    if (error.name === "CastError") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "查詢格式錯誤",
      });
    } else if (error.message === "此id查無電影") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "此id查無電影",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "伺服器錯誤",
      });
    }
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await Film.aggregate([
      {
        $sort: { category: 1, _id: 1 }, // Sort by category and then by _id to get the first film
      },
      {
        $group: {
          _id: "$category",
          name: { $first: "$category" },
          pic: { $first: { $arrayElemAt: ["$photos", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          pic: 1,
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log("Error getting categories:", error.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const getFilmByCategory = async (req, res) => {
  try {
    const films = await Film.find({ category: req.params.category });

    if (!films) throw new Error("此分類查無電影");

    res.status(StatusCodes.OK).json({
      success: true,
      result: films,
    });
  } catch (error) {
    console.error("Error getting films by category:", error.message);

    if (error.name === "CastError") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "查詢格式錯誤",
      });
    } else if (error.message === "此分類查無電影") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "此分類查無電影",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "伺服器錯誤",
      });
    }
  }
};

export const getFirstPicsOfAllFilms = async (req, res) => {
  try {
    const films = await Film.find({});
    const pics = films.map((film) => film.photos[0]).filter((photo) => photo); // Ensure the photo exists

    res.status(StatusCodes.OK).json({
      success: true,
      result: pics,
    });
  } catch (error) {
    console.error("Error getting first pics of all films:", error.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "伺服器錯誤",
    });
  }
};
