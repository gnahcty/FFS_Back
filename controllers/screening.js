import { StatusCodes } from "http-status-codes";
import Screening from "../models/screeningSchema.js";
import { getMessageFromValidationError } from "../utils/HandleMongooseError.js";
import mongoose from "mongoose";
import endOfDay from "date-fns/endOfDay";
import startOfDay from "date-fns/startOfDay";

export const addScreening = async (req, res) => {
  try {
    await Screening.create(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: getMessageFromValidationError(error),
      });
    } else if (error.name === "MongoServerError" && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "場次已存在",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "internal server error",
      });
    }
  }
};

export const getScreeningsById = async (req, res) => {
  try {
    const screenings = await Screening.find({ film: req.params.id }).exec();

    if (screenings.length === 0) {
      throw new Error("No screenings found");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      result: screenings,
    });
  } catch (error) {
    console.error(
      `Error getting screenings by id ${req.params.id}:`,
      error.message
    );
    if (error.message === "No screenings found") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No screenings found",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

export const getFestivalDateRange = async (req, res) => {
  try {
    // Find the screening with the earliest date
    const earliestScreening = await Screening.findOne()
      .sort({ time: 1 })
      .exec();

    // Find the screening with the latest date
    const latestScreening = await Screening.findOne().sort({ time: -1 }).exec();

    if (!earliestScreening || !latestScreening) {
      throw new Error("No screenings found");
    }

    const dateRange = {
      start: earliestScreening.time,
      end: latestScreening.time,
    };

    res.status(StatusCodes.OK).json({
      success: true,
      result: dateRange,
    });
  } catch (error) {
    console.error("Error getting festival date range:", error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getScreeningsByDate = async (req, res) => {
  try {
    const date = req.params.date;
    const [month, day] = date.split("_");
    const year = new Date().getFullYear(); // Use the current year
    const screenings = await Screening.find({
      time: mongoose.trusted({
        $gte: startOfDay(new Date(`${year}-${month}-${day}`)),
        $lte: endOfDay(new Date(`${year}-${month}-${day}`)),
      }),
    })
      .populate("film", "CName EName length photos")
      .exec();

    if (screenings.length === 0) {
      throw new Error("No screenings found");
    }

    // Group screenings by place
    const screeningsByPlace = screenings.reduce((acc, screening) => {
      const { place } = screening;
      if (!acc[place]) {
        acc[place] = [];
      }
      acc[place].push(screening);
      return acc;
    }, {});

    res.status(StatusCodes.OK).json({
      success: true,
      result: screeningsByPlace,
    });
  } catch (error) {
    console.error("Error getting screenings:", error.message);
    if (error.message === "No screenings found") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No screenings found",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};
