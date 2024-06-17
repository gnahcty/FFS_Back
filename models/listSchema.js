import { Schema, model, ObjectId } from "mongoose";

const listSchema = new Schema({
  screening: {
    type: ObjectId,
    ref: "screening",
    required: [true, "screening id missing"],
  },
  user: {
    type: ObjectId,
    ref: "users",
    required: [true, "user id missing"],
  },
  clash: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Boolean,
  },
  hidden: {
    type: Boolean,
  },
});

export default model("lists", listSchema);
