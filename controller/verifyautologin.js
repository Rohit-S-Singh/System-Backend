import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import UserProfile from "../models/profile/UserProfile.js";
dotenv.config();

const secretKey = process.env.JWT_SECRET;

const verifyToken = async (req, res) => {
  console.log("🟢 Verifying token...");

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, secretKey);
    console.log("🔹 Token decoded:", decoded);

    // ✅ USE userId (matches login token)
    const user = await User.findById(decoded.userId).lean();
    const userProfile = await UserProfile.findOne({ userId: decoded.userId }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    delete user.password;

    console.log("🔍 Final user sent to frontend =", user);

    return res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user,
      userProfile
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);

    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default verifyToken;
