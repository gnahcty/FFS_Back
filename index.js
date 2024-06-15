import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import mongoSanitize from "express-mongo-sanitize";
// import rateLimit from 'express-rate-limit'
import cors from "cors";
import userRoute from "./routes/userRoute.js";
import filmRoute from "./routes/filmRoute.js";
import screeningRoute from "./routes/screeningRoute.js";
import listRoute from "./routes/listRoute.js";
import "./utils/passport.js";

// 連線資料庫
mongoose.connect(process.env.DB_URL);

// 建立express伺服器
const app = express();

// 阻擋過於頻繁的請求
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   standardHeaders: true, // Return rate limit info in the `RateLim it-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//   statusCode: StatusCodes.TOO_MANY_REQUESTS,
//   message: "請求過於頻繁，請至少15分鐘後再試",
//   handler (req, res, next, options) {
//     res.status(options.statusCode).json({
//       success: false,
//       message: options.message
//     })
//   }
// }))

// 阻擋跨域請求
app.use(
  cors({
    /**
     *
     * @param {*} origin 請求來源
     * @param {*} callback callback(錯誤, 是否允許請求)
     */

    origin(origin, callback) {
      if (
        origin === undefined ||
        origin.includes("github") ||
        origin.includes("localhost")
      ) {
        callback(null, true); // Allow requests from GitHub and localhost
      } else {
        callback(new Error("Not allowed by CORS"), false); // Reject other origins
      }
    },
  })
);

// 接收cors的錯誤並回應
app.use((_, req, res, next) => {
  res.status(StatusCodes.FORBIDDEN).json({
    success: true,
    message: "未被允許的請求來源",
  });
});

// 設定express將傳入的body解析成json
// 不加的話req.body會是undefined
app.use(express.json());

app.use(mongoSanitize()); // prevent NoSQL injection by removing $ from request

// 處理express.json()格式錯誤
app.use((err, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: "格式錯誤",
  });
});

// request routing
app.use("/user", userRoute);
app.use("/film", filmRoute);
app.use("/screening", screeningRoute);
app.use("/list", listRoute);

// Handle 404 errors for unknown routes
app.all("*", (_, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "請求路徑不存在",
  });
});

// Start the server and connect to the database
app.listen(process.env.PORT || 4000, async () => {
  console.log("server up");
  await mongoose.connect(process.env.DB_URL); // Connect to MongoDB
  mongoose.set("sanitizeFilter", true); // Enable sanitization for queries
  console.log("database connected");
});
