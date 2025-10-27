import express from "express";
import { checkAuth, login, signup, updateProfile } from "../controller/userController.js"
import { protectRoute } from "../middleware/auth.js";
import { getUsers } from "../controller/userController.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.get("/all", protectRoute, getUsers);
userRouter.get("/get-users", protectRoute, getUsers); // keep for backward compatibility

export default userRouter;