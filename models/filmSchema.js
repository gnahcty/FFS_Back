import { Schema, model, ObjectId } from "mongoose";

const filmSchema = new Schema({
  CName: {
    type: String,
    required: [true, "請輸入中文片名"],
    unique: true,
  },
  EName: {
    type: String,
    required: [true, "請輸入英文片名"],
  },
  category: {
    type: String,
    required: [true, "請輸入類別"],
  },
  photos: {
    type: [String],
  },
  region: {
    type: String,
    required: [true, "請輸入地區"],
  },
  release_year: {
    type: String,
    required: [true, "請輸入上映年份"],
  },
  format: {
    type: String,
    required: [true, "請輸入格式"],
  },
  color: {
    type: String,
    required: [true, "請輸入顏色"],
  },
  length: {
    type: String,
    required: [true, "請輸入片長"],
  },
  rating: {
    type: String,
    required: [true, "請輸入分級"],
  },
  awards: {
    type: [String],
  },
  description: {
    type: String,
    required: [true, "請輸入劇情介紹"],
  },
  directors: {
    type: [String],
    required: [true, "請輸入導演"],
  },
  screenings: {
    type: [ObjectId],
    ref: "screenings",
  },
});

export default model("film", filmSchema);
