const Mongoose = require('mongoose');

const { Schema } = Mongoose;

// User Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: () => {
      return this.provider !== 'email' ? false : true;
    }
  },
  description:{
    type: String
  },
  rating: {
    type: Number
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Movies', UserSchema);
