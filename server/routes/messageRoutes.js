import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getUserForSidebar,
  getMessage,
  markMessageAsSeen,
  sendMessage
} from "../controller/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUserForSidebar);
messageRouter.get("/:id", protectRoute, getMessage);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen); // ✅ fixed missing slash
messageRouter.post("/send/:id", protectRoute, sendMessage);

export default messageRouter;
