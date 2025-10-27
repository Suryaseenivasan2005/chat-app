import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { io, userSocketMap } from "../server.js";

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if users exist
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingRequest) {
      return res.json({ success: false, message: "Friend request already exists" });
    }

    // Create new friend request
    const friendRequest = await FriendRequest.create({
      senderId,
      receiverId,
      status: 'pending'
    });

    res.json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Send friend request error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all users (for friend request page)
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // Find other users (exclude current user and bots)
    const users = await User.find({
      _id: { $ne: currentUserId },
      isBot: { $ne: true }
    }).select('fullName profilePic bio').lean();

    // Find any friend requests involving current user
    const friendRequests = await FriendRequest.find({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    }).lean();

    // Map friendship status onto users
    const usersWithStatus = users.map(u => {
      const uid = u._id.toString();
      const req = friendRequests.find(fr => (
        fr.senderId.toString() === currentUserId && fr.receiverId.toString() === uid
      ) || (
        fr.receiverId.toString() === currentUserId && fr.senderId.toString() === uid
      ));

      return {
        ...u,
        friendshipStatus: req ? req.status : 'none',
        sentByMe: req ? req.senderId.toString() === currentUserId : false
      };
    });

    res.json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.log("Get all users error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get friend requests for current user
export const getFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const requests = await FriendRequest.find({
      receiverId: currentUserId,
      status: 'pending'
    }).populate('senderId', 'fullName profilePic');

    res.json({ success: true, requests });
  } catch (error) {
    console.log("Get friend requests error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Accept or reject friend request
export const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.json({ success: false, message: "Friend request not found" });
    }

    if (friendRequest.receiverId.toString() !== req.user._id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();

    // Notify both users (if online) that friend request status changed so frontends can refresh
    try {
      const senderId = friendRequest.senderId.toString();
      const receiverId = friendRequest.receiverId.toString();
      const senderSocket = userSocketMap[senderId];
      const receiverSocket = userSocketMap[receiverId];
      const payload = { requestId: friendRequest._id, status: friendRequest.status, senderId, receiverId };
      if (senderSocket) io.to(senderSocket).emit('friendRequestUpdated', payload);
      if (receiverSocket) io.to(receiverSocket).emit('friendRequestUpdated', payload);
    } catch (err) {
      console.error('Failed to emit friendRequestUpdated', err.message);
    }

    res.json({ 
      success: true, 
      message: `Friend request ${action}ed successfully` 
    });
  } catch (error) {
    console.log("Respond to friend request error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Block / unfriend a user - this will remove accepted friend relationship
export const blockUser = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const currentUserId = req.user._id;

    // Remove any accepted friend requests between the two users
    await FriendRequest.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId, status: 'accepted' },
        { senderId: otherUserId, receiverId: currentUserId, status: 'accepted' }
      ]
    });

    // Optionally also remove pending requests between them
    await FriendRequest.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    });

    res.json({ success: true, message: 'User removed from friends' });
  } catch (error) {
    console.log('Block user error:', error.message);
    res.json({ success: false, message: error.message });
  }
};
