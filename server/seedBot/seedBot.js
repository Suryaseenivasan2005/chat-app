import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: "../.env" });

const connectAndSeed = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is undefined. Check your .env file.");

    await mongoose.connect(uri);

    console.log("✅ Connected to MongoDB");

    const existingBot = await User.findOne({ isBot: true });
    if (existingBot) {
      console.log("⚠️  Bumble Bee already exists.");
      process.exit();
    }

    await User.create({
      fullName: "Bumble Bee",
      profilePic: "https://i.imgur.com/your-bot-avatar.png",
      bio: "Your AI assistant",
      isBot: true
    });

    console.log("🤖 Bumble Bee seeded successfully.");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

connectAndSeed();
