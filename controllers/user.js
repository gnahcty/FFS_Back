import { StatusCodes } from "http-status-codes";
// import mongoose from "mongoose";
import user from "../models/userSchema.js";
import { getMessageFromValidationError } from "../utils/HandleMongooseError.js";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    await user.create(req.body);
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
        message: "帳號已註冊",
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "internal server error",
      });
    }
  }
};

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7 days",
    });
    req.user.tokens.push(token);

    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        token,
        _id: req.user._id,
      },
    });
  } catch (error) {
    console.log(`login error: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "登入錯誤",
    });
  }
};

export const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token !== req.token);
    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
    });
  } catch (error) {
    console.log(`logout error: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "發生未知錯誤，請稍後再試",
    });
  }
};

export const extend = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token);
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7 days",
    });
    req.user.tokens[idx] = token;
    await req.user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: token,
    });
  } catch (error) {
    console.log(`JWT extend error: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "簽發JWT時發生錯誤",
    });
  }
};

export const getProfile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "",
      result: {
        _id: req.user._id,
        account: req.user.account,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.log(`getProfile error: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error",
    });
  }
};
