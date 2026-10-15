import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  try {
    // Reading the header inside the try: a missing/malformed Authorization
    // header used to crash with an unhandled TypeError (ugly 500 + stack
    // trace leaked to the client) instead of a clean 401.
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Please login. We need a token to verify you!' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.log("🚀 ~ file: index.js:19 ~ jwt.verify ~ err:", err);
        return res.status(403).json({ success: false, message: 'You are not authorized.' });
      }

      // Tokens have been signed with either `{ userId }` (email/password
      // login) or `{ id }` (Google sign-in) depending on which flow issued
      // them. Normalize both so every controller can rely on either key.
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId,
        userId: decoded.userId || decoded.id,
      };
      next();
    });
  } catch (error) {
    console.log("🚀 ~ file: index.js:15 ~ authenticateToken ~ error:", error);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
};

export default  authenticateToken ;
