import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect the routes
export const authenticateToken = async (req, res, next) => {
  return protectRoute(req, res, next);
};

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "JWT must be provided" });
    }

    const token = authHeader.split(" ")[1]; // ✅ Extract token from Bearer header
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth error:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
