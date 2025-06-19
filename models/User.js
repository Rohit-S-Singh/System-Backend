import mongoose from "mongoose";


const UserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: [true, "Please provide a email"],
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
    }

},{timestamps : true});

const User = mongoose.models.users ||  mongoose.model("users", UserSchema);

export default User;