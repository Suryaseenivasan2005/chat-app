import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  const demoUsers = await User.find({ isDemo: true }).sort({ createdAt: -1 });
  console.log("All demo users:", demoUsers.map(u => ({ name: u.fullName, email: u.email })));
  process.exit(0);
}
test().catch(console.error);
