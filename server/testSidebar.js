import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import FriendRequest from './models/FriendRequest.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  const demoUsers = await User.find({ isDemo: true }).sort({ createdAt: -1 }).limit(1);
  if (demoUsers.length === 0) {
    console.log("No demo users found");
    process.exit(0);
  }
  const currentUserId = demoUsers[0]._id.toString();
  console.log("Found demo user:", currentUserId);
  
  let bot = await User.findOne({ isBot: true });
  console.log("Found bot:", bot?._id);
  
  const acceptedRequests = await FriendRequest.find({
    $or: [
      { senderId: currentUserId, status: 'accepted' },
      { receiverId: currentUserId, status: 'accepted' }
    ]
  });
  console.log("Accepted requests:", acceptedRequests.length);
  
  const friendIds = acceptedRequests.map(req =>
    req.senderId.toString() === currentUserId ? req.receiverId : req.senderId
  );
  console.log("Friend IDs:", friendIds);
  
  let users = await User.find({
    _id: { $in: [...friendIds, bot?._id].filter(Boolean) }
  });
  console.log("Fetched users length:", users.length);
  console.log("Users:", users.map(u => u.fullName));
  
  process.exit(0);
}

test().catch(console.error);
