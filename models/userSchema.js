import mongoose, { Schema, model } from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcrypt from "bcrypt";

// Define collection structure
const userSchema = new Schema({
  account: {
    type: String,
    required: [true, "請輸入帳號"],
    unique: true,
    minLength: [6, "帳號最少6個字元"],
    maxLength: [20, "帳號最多20個字元"],
    match: [/^[a-zA-Z0-9_]*$/, "帳號只能包含英文、數字、底線"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "請輸入email"],
    unique: true,
    // 自訂email格式驗證
    validate: {
      // 自訂驗證函式
      validator: function (value) {
        return isEmail(value);
      },
      message: "email格式錯誤",
    },
  },
  password: {
    type: String,
    required: [true, "請輸入密碼"],
    // 這裡存的是加密後的密碼，所以不能在這裡驗證
  },
  tokens: {
    type: [String],
  },
});

const validatePassword = (password) =>
  password.length >= 6 && password.length <= 20;

const validateAndEncryptPassword = (user, next) => {
  if (validatePassword(user.password)) {
    user.password = bcrypt.hashSync(user.password, 10);
  } else {
    // 產生一個mongoose錯誤物件
    const error = new mongoose.Error.ValidationError(null);
    // 加入錯誤訊息
    error.addError(
      "password",
      new mongoose.Error.ValidationError({
        message: "密碼長度需在6-20之間",
      })
    );
    // 帶著錯誤訊息進入下一步
    next(error);
    return;
  }
};

// 新增資料時，存入資料庫前，驗證密碼並將密碼加密
userSchema.pre("save", function (next) {
  const user = this; //把這筆資料綁到user

  // 如果密碼有變更，就驗證並加密
  if (user.isModified("password")) {
    validateAndEncryptPassword(user, next);
  }
  next();
});

// 更改密碼後，存入資料庫前，驗證密碼並將密碼加密
userSchema.pre("findOneAndUpdate", function (next) {
  const user = this._update; //把這筆資料綁到user

  // 如果密碼有變更，就驗證並加密
  if (user.isModified("password")) {
    validateAndEncryptPassword(user, next);
  }

  next();
});

// 用schema的欄位設定建立一個mongoose model
// 設定collection名稱為users (設定單數會自動轉複數)
export default model("users", userSchema);
