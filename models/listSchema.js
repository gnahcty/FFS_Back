import { Schema, model, ObjectId } from "mongoose";

const listSchema = new Schema({
  screening: {
    type: ObjectId,
    ref: "screenings",
    required: [true, "screening id missing"],
  },
  user: {
    type: ObjectId,
    ref: "users",
    required: [true, "user id missing"],
  },
  clash: {
    type: Boolean,
  },
  locked: {
    type: Boolean,
  },
  hidden: {
    type: Boolean,
  },
  deleted: {
    type: Boolean,
  },
});

export default model("lists", listSchema);
