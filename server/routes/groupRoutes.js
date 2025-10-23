import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { createGroup } from "../controller/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/", protectRoute, createGroup);

export default groupRouter;


