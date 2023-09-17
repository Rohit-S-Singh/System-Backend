const Mongoose = require('mongoose');


const { Schema } = Mongoose;

// User Schema
const UserSchema = new Schema({
  email: {
    type: String,
    required: () => {
      return this.provider !== "email" ? false : true;
    },
  },
  name: {
    type: String,
  },
  password: {
    type: String,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
  givenRatings: {
    type: Schema.Types.Mixed,
  },
  Recommendations: {
    type: [String],
  },
});

module.exports = Mongoose.model('User', UserSchema);
