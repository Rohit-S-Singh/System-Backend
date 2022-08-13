const Mongoose = require("mongoose");

const { Schema } = Mongoose;

// name, description, runtime, releasedDate, Poster;

// User Schema
const MovieSchema = new Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  runtime: {
    type: String,
  },
  releasedDate: {
    type: Date,
  },
  Poster: {
    type: String,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model("Movies", MovieSchema);
