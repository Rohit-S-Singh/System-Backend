import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: Number,
  },
  online: {
    type: Boolean,
    default: false,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  tokenExpiry: {
    type: Date,
  },

  // ✅ New field to store HTML email template
  htmlEmailTemplate: {
    rawTemplate: {
      type: String,
    },
    placeholders: {
      type: Object,
    },
    finalHtml: {
      type: String,
    },
  },

}, { timestamps: true });

const User = mongoose.models.users || mongoose.model("users", UserSchema);

export default User;
