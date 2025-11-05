import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js"; // ✅ Import User model

dotenv.config();

const secretKey = process.env.JWT_SECRET || "your-secret-key";

const verifyToken = async (req, res) => {
  console.log("🟢 Verifying token...");

  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Please login. No token provided!" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔹 Token received:", token);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token missing in header!" });
    }

    // ✅ Verify token
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        console.error("❌ Token verification failed:", err);
        return res
          .status(403)
          .json({ success: false, message: "Invalid or expired token!" });
      }

      console.log("✅ Token verified successfully for user:", decoded);

      try {
        // ✅ Find the user in database using decoded email
        const user = await User.findOne({ email: decoded.email }).select(
          "-password" // optional: exclude password
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found in database",
          });
        }

        console.log(user);
        

        // ✅ Return full user details
        return res.status(200).json({
          success: true,
          message: "Token verified successfully",
          user,
        });
      } catch (dbError) {
        console.error("❌ Error fetching user from DB:", dbError);
        return res.status(500).json({
          success: false,
          message: "Error fetching user from database",
        });
      }
    });
  } catch (error) {
    console.error("❌ Error in token verification:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export default verifyToken;
