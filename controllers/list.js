import { StatusCodes } from "http-status-codes";
import { getMessageFromValidationError } from "../utils/HandleMongooseError.js";
// import mongoose from "mongoose";
import List from "../models/listSchema.js";

export const addToList = async (req, res) => {
  try {
    let screening = await List.findOne({
      screening: req.body.screening,
      user: req.user._id,
    });
    if (!screening) {
      screening = await List.create({
        screening: req.body.screening,
        user: req.user._id,
        clash: req.body.clash,
        locked: req.body.locked,
        hidden: req.body.hidden,
        deleted: req.body.deleted,
      });
      res.status(StatusCodes.OK).json({
        success: true,
        message: "created",
      });
    } else {
      screening.deleted = true;
      await screening.save();
      res.status(StatusCodes.OK).json({
        success: true,
        message: "deleted",
      });
    }
  } catch (error) {
    console.log(
      `Error adding screening ${req.body.screening} to user ${req.user._id}'s list:`,
      error.message
    );
    if (error.name === "ValidationError") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: getMessageFromValidationError(error),
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "internal server error",
      });
    }
  }
};

export const getListsByUser = async (req, res) => {
  try {
    const lists = await List.find({ user: req.body.user._id })
      .populate({
        path: "screening",
        model: "screening",
        populate: {
          path: "movie_id",
          model: "film",
        },
      })
      .exec();

    // Use Object.groupBy to group the screenings by film.CName
    const groupedByFilm = Object.groupBy(
      lists,
      (list) => list.screening.movie_id.CName
    );

    // Convert the grouped object to the desired array format
    const result = Object.keys(groupedByFilm).map((filmName) => ({
      [filmName]: groupedByFilm[filmName].map((list) => list.screening),
    }));
    res.status(StatusCodes.OK).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(
      `Error getting lists by user ${req.body.user._id}:`,
      error.message
    );
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};
