import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import User from "../models/userSchema.js";
import passportJWT from "passport-jwt";

// 使用驗證策略
// passport.use(驗證方式名稱, 驗證策略(驗證欄位名稱, 驗證函式))
passport.use(
  "login",
  new passportLocal.Strategy(
    // 使用passportLocal驗證有沒有account和password的欄位，沒有的話會throw error : Missing credentials
    {
      // 修改預設的usernameField和passwordField以符合我們的資料庫欄位名稱
      usernameField: "account",
      passwordField: "password",
    },
    // passportLocal驗證通過後會呼叫這個函式
    async (account, password, done) => {
      try {
        const user = await User.findOne({ account });

        if (!user) throw new Error("帳號不存在");
        if (!bcrypt.compareSync(password, user.password))
          throw new Error("密碼錯誤");

        // done(error, data, info message)
        // 帶著上面的資料進入auth.js的passport.authenticate
        return done(null, user);
      } catch (error) {
        if (error.message === "帳號不存在" || error.message === "密碼錯誤") {
          return done(null, false, {
            message: error.message,
          });
        } else {
          return done(error, false, { message: "伺服器錯誤" });
        }
      }
    }
  )
);

// 使用JWT策略驗證JWT token
passport.use(
  "jwt",
  new passportJWT.Strategy(
    {
      // where to find the token
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      // JWT secret
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
      ignoreExpiration: true,
    },
    // payload is the decoded JWT token (User._id in this case)
    async (req, payload, done) => {
      try {
        // payload.exp is the expiration time of the token (in seconds)
        // convert it to milliseconds and compare it with the current time
        const expired = payload.exp * 1000 < Date.now();
        const url = req.baseUrl + req.path;
        if (expired && url !== "/user/extend" && url !== "/user/logout") {
          throw new Error("登入資訊已過期，請重新登入");
        }
        // extract token from Authorization header (eg. Bearer lkerfjlkrnfrmlsdfjlsd)
        const token = req.headers.authorization.split(" ")[1];
        // find user by _id and token
        const user = await User.findOne({ _id: payload._id, tokens: token });
        if (!user) throw new Error("JWT token驗證失敗");

        return done(null, { user, token });
      } catch (error) {
        return done(null, false, { message: error.message });
      }
    }
  )
);
