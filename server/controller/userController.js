import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/message.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio, profilePic } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const user = await User.findOne({ email });

    if (user) {
      return res.json({ success: false, message: "Account already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile picture
    let profilePicUrl = "";
    if (profilePic) {
      if (profilePic.startsWith('data:')) {
        // If it's a base64 image, upload to cloudinary
        const upload = await cloudinary.uploader.upload(profilePic);
        profilePicUrl = upload.secure_url;
      } else {
        // If it's a URL (from our default avatars), use it directly
        profilePicUrl = profilePic;
      }
    }

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
      profilePic: profilePicUrl
    });

    const token = generateToken(newUser._id);
    res.json({ success: true, userData: newUser, token, message: "Account created successfully" });
  }
  catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}

// Controller to login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const UserData = await User.findOne({ email });

    if (!UserData) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, UserData.password);

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(UserData._id);

    res.json({ success: true, userData: UserData, token, message: "Login successful" });
  }
  catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName, backgroundImage } = req.body;

    const userId = req.user._id;
    let updatedUser;

    const updatePayload = { bio, fullName };
    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatePayload.profilePic = upload.secure_url;
    }
    if (backgroundImage) {
      const bgUpload = await cloudinary.uploader.upload(backgroundImage);
      updatePayload.backgroundImage = bgUpload.secure_url;
    }
    updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}

// Get User function
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Determine user query based on if current user is a demo user
    const userQuery = req.user.isDemo
      ? { _id: { $ne: currentUserId }, isBot: true }
      : { _id: { $ne: currentUserId }, isBot: { $ne: true } };

    const users = await User.find(userQuery)
      .select('fullName email bio profilePic') // Select only needed fields
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    // Get all friend requests involving current user
    const friendRequests = await FriendRequest.find({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    });

    // Add friendship status to each user
    const usersWithStatus = users.map(user => {
      const request = friendRequests.find(req =>
        (req.senderId.toString() === user._id.toString() && req.receiverId.toString() === currentUserId.toString()) ||
        (req.receiverId.toString() === user._id.toString() && req.senderId.toString() === currentUserId.toString())
      );

      return {
        ...user,
        friendshipStatus: request ? request.status : 'none',
        sentByMe: request ? request.senderId.toString() === currentUserId.toString() : false
      };
    });

    res.status(200).json({
      success: true,
      users: usersWithStatus
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Demo login and setup
export const loginDemo = async (req, res) => {
  try {
    // 1. Cleanup expired demo users
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredUsers = await User.find({ isDemo: true, createdAt: { $lt: fifteenMinsAgo } });
    
    if (expiredUsers.length > 0) {
      const expiredUserIds = expiredUsers.map(u => u._id);
      
      // Delete their messages
      await Message.deleteMany({ $or: [{ senderId: { $in: expiredUserIds } }, { receiverId: { $in: expiredUserIds } }] });
      
      // Delete their friend requests
      await FriendRequest.deleteMany({ $or: [{ senderId: { $in: expiredUserIds } }, { receiverId: { $in: expiredUserIds } }] });
      
      // Delete the users
      await User.deleteMany({ _id: { $in: expiredUserIds } });
      console.log(`Cleaned up ${expiredUsers.length} expired demo users.`);
    }

    // 2. Create new Demo User
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const email = `demo_${Date.now()}@talklet.app`;
    const password = await bcrypt.hash("demo_password_123", 10);

    const demoUser = await User.create({
      fullName: `Demo User ${randomSuffix}`,
      email,
      password,
      bio: "I'm checking out Talklet in Demo mode! 🚀",
      isDemo: true
    });

    // 3. Find Bumble Bee bot
    const bot = await User.findOne({ isBot: true });
    
    if (bot) {
      // Create accepted friend request between Demo User and Bot
      await FriendRequest.create({
        senderId: demoUser._id,
        receiverId: bot._id,
        status: "accepted"
      });

      // Send a welcome message from the bot
      await Message.create({
        senderId: bot._id,
        receiverId: demoUser._id,
        text: "Hi there! 👋 Welcome to Talklet's Demo Mode. I'm Bumble Bee. Feel free to send me messages here. Note that your session and data will be automatically reset after 15 minutes.",
        isGroupMessage: false
      });
    }

    // 4. Generate token and return
    const token = generateToken(demoUser._id);
    res.json({ success: true, userData: demoUser, token, message: "Demo session started successfully" });
  } catch (err) {
    console.error("Demo login error:", err);
    res.status(500).json({ success: false, message: "Failed to start demo session" });
  }
};
