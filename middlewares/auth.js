import passport from "passport";
import jsonwebtoken from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

export const login = (req, res, next) => {
  // 先使用passport.js裡寫的login驗證策略
  // 停用session防止cors問題
  // 帶著passport.js裡的done(error, user, info)繼續執行後面的函式
  passport.authenticate("login", { session: false }, (error, user, info) => {
    if (error || !user) {
      if (info.message === "Missing credentials") {
        info.message = "請輸入帳號密碼";
      }

      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: info.message,
      });
      return;
    }
    // 將passport.js傳過來的user資料存入req.user
    req.user = user;
    // 繼續到controller
    next();
  })(req, res, next);
};

export const jwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, data, info) => {
    if (error || !data) {
      // 如果jwt token格式不對、過期或是被竄改，會在這裡被攔截
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        if (info.message === "jwt expired") {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "驗證資訊過期，請重新登入",
          });
        } else {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "JWT驗證失敗",
          });
        }
      } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message || "未知錯誤",
        });
      }
    }
    req.user = data.user;
    req.token = data.token;
    next();
  })(req, res, next);
};
