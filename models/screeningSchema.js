import { Schema, model, ObjectId } from "mongoose";

const screeningSchema = new Schema({
  movie_id: {
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
  QASessions: {
    type: Boolean,
  },
});

export default model("screening", screeningSchema);
