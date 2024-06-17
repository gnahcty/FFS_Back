import { Schema, model, ObjectId } from "mongoose";

const screeningSchema = new Schema({
  film: {
    type: ObjectId,
    ref: "film",
    required: [true, "film id missing"],
  },
  place: {
    type: String,
    required: [true, "cinema missing"],
  },
  time: {
    type: Date,
    required: [true, "time missing"],
  },
  endTime: {
    type: Date,
  },
  QASessions: {
    type: Boolean,
  },
});

export default model("screening", screeningSchema);
