import { StatusCodes } from "http-status-codes";
import { getMessageFromValidationError } from "../utils/HandleMongooseError.js";
// import mongoose from "mongoose";
// import startOfDay from "date-fns/startOfDay";
// import endOfDay from "date-fns/endOfDay";
import isWithinInterval from "date-fns/isWithinInterval";
import List from "../models/listSchema.js";

const checkClash = async (list, action) => {
  try {
    const currentList = await list.populate("screening");

    const userLists = await List.find({ user: list.user }).populate(
      "screening"
    );

    const start = new Date(currentList.screening.time);
    const end = new Date(currentList.screening.endTime);

    for (const list of userLists) {
      // Skip the current list and hidden lists
      if (list._id.toString() === currentList._id.toString() || list.hidden) {
        continue;
      }
      const screeningStart = new Date(list.screening.time);
      const screeningEnd = new Date(list.screening.endTime);

      // Check if screening time falls within the given time range
      const clash =
        isWithinInterval(screeningStart, { start, end }) ||
        isWithinInterval(screeningEnd, { start, end }) ||
        (screeningStart <= start && screeningEnd >= end);

      // Update the clash status if there is a clash
      if (clash) {
        if (action === "add") {
          list.clash++;
          currentList.clash++;
          await currentList.save();
        } else {
          list.clash--;
        }
        await list.save();
      }
    }
  } catch (error) {
    console.log(`Error checking clash for list ${list._id}:`, error.message);
  }
};

export const addToList = async (req, res) => {
  try {
    let list = await List.findOne({
      screening: req.body.screening,
      user: req.user._id,
    })
      .populate("screening")
      .exec();

    if (!list) {
      list = await List.create({
        screening: req.body.screening,
        user: req.user._id,
        locked: false,
        hidden: false,
        deleted: false,
      });
      await checkClash(list, "add");
      res.status(StatusCodes.OK).json({
        success: true,
        message: "created",
      });
    } else {
      await List.deleteOne({
        screening: req.body.screening,
        user: req.user._id,
      });
      await checkClash(list, "remove");
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
    const lists = await List.find({ user: req.user._id })
      .populate({
        path: "screening",
        model: "screening",
        populate: {
          path: "film",
          model: "film",
          select: "CName EName photos",
        },
      })
      .exec();

    // const groupedByFilm = {};

    // lists.forEach((list) => {
    //   const filmName = list.screening.film.CName;

    //   if (!groupedByFilm[filmName]) {
    //     groupedByFilm[filmName] = [];
    //   }

    //   groupedByFilm[filmName].push(list.screening);
    // });

    // // Convert the grouped object to the desired array format
    // const result = Object.keys(groupedByFilm).map((filmName) => ({
    //   [filmName]: groupedByFilm[filmName],
    // }));

    res.status(StatusCodes.OK).json({
      success: true,
      result: lists,
    });
  } catch (error) {
    console.log(`Error getting lists by user ${req.user._id}:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};

// list.hidden = true; clash = 0;
// 前端判斷是否要解鎖
// body: {id : list id}
export const hideList = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.body.id, user: req.user._id });

    if (!list) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "list not found",
      });
      return;
    }

    if (list.user.toString() !== req.user._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "forbidden",
      });
      return;
    }

    if (list.hidden === true) return;

    list.hidden = true;
    // Reset the clash count
    list.clash = 0;
    await checkClash(list, "remove");

    await list.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "deleted",
    });
  } catch (error) {
    console.log(`Error deleting list ${req.body.id}:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};

// list.hidden = false; recount clash
// 前端判斷是否要解鎖
// body: {id : list id}
export const unhideList = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.body.id, user: req.user._id });

    if (!list) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "list not found",
      });
      return;
    }

    if (list.user.toString() !== req.user._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "forbidden",
      });
      return;
    }

    if (list.hidden === false) return;

    list.hidden = false;
    list.clash = 0;
    await checkClash(list, "add");

    await list.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "revived",
    });
  } catch (error) {
    console.log(`Error reviving list ${req.body.id}:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};

// list.locked = true; unhide list if hidden; hide all other unhidden lists with the same film
// body: {id : list id, filmID: film id}}
export const lockList = async (req, res) => {
  try {
    const targetList = await List.findOne({
      _id: req.body.id,
      user: req.user._id,
    });

    if (!targetList) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "list not found",
      });
      return;
    }

    if (targetList.user.toString() !== req.user._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "forbidden",
      });
      return;
    }

    // find all list of same user, 如果screening.film = req.body.filmID會顯示，否則screening為null
    const populatedList = await List.find({ user: req.user._id }).populate({
      path: "screening",
      match: { film: req.body.filmID },
    });

    const sameFilmLists = populatedList.filter(
      (list) => list.screening !== null
    );

    // if the list is hidden, unhide it
    if (targetList.hidden === true) {
      targetList.hidden = false;
      targetList.clash = 0;
      await checkClash(targetList, "add");
    }

    targetList.locked = true;

    // unlock all other lists with the same film
    for (const list of sameFilmLists) {
      if (list._id.toString() !== targetList._id.toString()) {
        list.locked = false;
        // hide all other unhidden lists with the same film
        if (list.hidden === false) {
          list.hidden = true;
          list.clash = 0;
          await checkClash(list, "remove");
        }

        await list.save();
      }
    }

    await targetList.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "locked",
    });
  } catch (error) {
    console.log(`Error locking list ${req.body.id}:`, error.message);
    console.log(req.body.filmID);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};

// unlock all lists with the same film
// body: {id : list id, filmID: film id}
// 如果傳入的是鎖定場次，顯示所有場次
// 如果傳入的是非鎖定場次，僅顯示該場次
export const unlockFilm = async (req, res) => {
  try {
    const targetList = await List.findOne({
      _id: req.body.id,
      user: req.user._id,
    });

    if (!targetList) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "list not found",
      });
      return;
    }

    if (targetList.user.toString() !== req.user._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "forbidden",
      });
      return;
    }

    // find all list of same user, 如果screening.film = req.body.filmID會顯示，否則screening為null
    const populatedList = await List.find({ user: req.user._id }).populate({
      path: "screening",
      match: { film: req.body.filmID },
    });

    const sameFilmLists = populatedList.filter(
      (list) => list.screening !== null
    );

    for (const list of sameFilmLists) {
      // unlock all lists of the same film
      list.locked = false;
      // if target list isn't hidden (therefore is the locked in screening)
      if (targetList.hidden === false) {
        // unhide all hidden lists of the same film
        if (list.hidden === true) {
          list.hidden = false;
          list.clash = 0;
          await checkClash(list, "add");
        }
      }
      list.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "unlocked",
    });
  } catch (error) {
    console.log(`Error unlocking list ${req.body.id}:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal server error",
    });
  }
};
