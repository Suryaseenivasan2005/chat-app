import express from "express";
import { sendFriendRequest, getAllUsers, getFriendRequests, respondToFriendRequest, blockUser } from "../controller/friendController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Send friend request
router.post("/request/:id", authenticateToken, sendFriendRequest);

// Get all users (for friend request page)
router.get("/all", authenticateToken, getAllUsers);

// Get friend requests for current user
router.get("/requests", authenticateToken, getFriendRequests);

// Accept or reject friend request
router.put("/request/:requestId", authenticateToken, respondToFriendRequest);

// Block / unfriend a user
router.post('/block/:id', authenticateToken, blockUser);

export default router;
