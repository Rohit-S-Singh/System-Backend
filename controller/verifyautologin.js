import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const secretKey = process.env.JWT_SECRET || "your-secret-key";

const verifyToken = async (req, res) => {
  console.log("🟢 Verifying token...");

  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Please login. No token provided!",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing from header!",
      });
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        console.log("❌ Invalid token:", err);
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token!",
        });
      }

      console.log("🔹 Token decoded:", decoded);

      try {
        // ⭐ Use lean() to ensure ALL nested fields are returned
        const user = await User.findOne({ email: decoded.email }).lean();

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // ⭐ Remove password safely
        delete user.password;

        console.log("🔍 Final user sent to frontend =", user);

        // ⭐ Return full user including userType ALWAYS
        return res.status(200).json({
          success: true,
          message: "Token verified successfully",
          user,
        });

      } catch (dbErr) {
        console.log("❌ DB fetch error:", dbErr);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default verifyToken;
