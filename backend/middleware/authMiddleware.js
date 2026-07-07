import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  // Check Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract Token
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find User
      req.user = await User.findById(decoded.id).select("-password");

      next();

    } catch (error) {
      return res.status(401).json({
        message: "Not Authorized",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "No Token Found",
    });
  }
};

export default protect;