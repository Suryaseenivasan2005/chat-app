import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import FriendRequest from './models/FriendRequest.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const currentUserId = (await User.findOne({ email: /demo_/ }))._id.toString();
  console.log("Current User:", currentUserId);
  
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
  
  let bot = await User.findOne({ isBot: true });

  let users = await User.find({
    _id: { $in: [...friendIds, bot._id] }
  });
  
  console.log("Found users length:", users.length);
  console.log("Users:", users.map(u => u.fullName));

  process.exit(0);
}

test().catch(console.error);
