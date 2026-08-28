import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import FriendRequest from './models/FriendRequest.js';
import Message from './models/message.js';
import bcrypt from 'bcryptjs';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  const ts = Date.now();
  const password = await bcrypt.hash("demo_internal_pass", 10);

  const demoUser = await User.create({
    fullName: `Guest Explorer`,
    email: `demo_${ts}@talklet.app`,
    password,
    bio: "👀 Exploring Talklet in Demo Mode",
    profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
    isDemo: true,
  });
  console.log("Created demo user");

  const peers = await User.insertMany([
    {
      fullName: "Alice Morgan",
      email: `alice_${ts}@talklet.app`,
      password,
      bio: "Designer & coffee lover ☕",
      profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
      isDemo: true,
    }
  ]);
  console.log("Created peers");

  const [alice] = peers;

  try {
    await FriendRequest.insertMany([
      { senderId: demoUser._id, receiverId: alice._id, status: "accepted" }
    ]);
    console.log("Created FriendRequests");
  } catch(e) {
    console.error("Error creating FriendRequests:", e);
  }

  process.exit(0);
}

test().catch(console.error);
