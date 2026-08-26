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

    // Determine user query based on if current user is a demo user.
    // Demo users only see: bots OR other demo contacts that are their friends.
    // Real users see all non-bot users.
    let userQuery;
    if (req.user.isDemo) {
      // Get IDs of accepted friends for this demo user
      const acceptedFriendships = await FriendRequest.find({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        status: "accepted"
      });
      const friendIds = acceptedFriendships.map(f =>
        f.senderId.toString() === req.user._id.toString() ? f.receiverId : f.senderId
      );
      // Only show friends (bot + demo peers)
      userQuery = { _id: { $in: friendIds } };
    } else {
      userQuery = { _id: { $ne: currentUserId }, isBot: { $ne: true }, isDemo: { $ne: true } };
    }

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
    // 1. Cleanup expired demo users (isDemo=true, older than 15 min)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredUsers = await User.find({ isDemo: true, createdAt: { $lt: fifteenMinsAgo } });

    if (expiredUsers.length > 0) {
      const expiredUserIds = expiredUsers.map(u => u._id);
      await Message.deleteMany({ $or: [{ senderId: { $in: expiredUserIds } }, { receiverId: { $in: expiredUserIds } }] });
      await FriendRequest.deleteMany({ $or: [{ senderId: { $in: expiredUserIds } }, { receiverId: { $in: expiredUserIds } }] });
      await User.deleteMany({ _id: { $in: expiredUserIds } });
      console.log(`[Demo] Cleaned up ${expiredUsers.length} expired demo users.`);
    }

    // 2. Create the Demo User (the visitor)
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

    // 3. Seed 3 realistic demo peer contacts (also flagged isDemo for cleanup)
    const peers = await User.insertMany([
      {
        fullName: "Alice Morgan",
        email: `alice_${ts}@talklet.app`,
        password,
        bio: "Designer & coffee lover ☕",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        isDemo: true,
      },
      {
        fullName: "Liam Chen",
        email: `liam_${ts}@talklet.app`,
        password,
        bio: "Full-stack dev | open source 🛠️",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=liam",
        isDemo: true,
      },
      {
        fullName: "Sophie Ramos",
        email: `sophie_${ts}@talklet.app`,
        password,
        bio: "Travel & photography 📸",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
        isDemo: true,
      },
    ]);

    const [alice, liam, sophie] = peers;

    // 4. Create accepted friendships between demoUser and each peer
    await FriendRequest.insertMany([
      { senderId: demoUser._id, receiverId: alice._id, status: "accepted" },
      { senderId: demoUser._id, receiverId: liam._id,  status: "accepted" },
      { senderId: demoUser._id, receiverId: sophie._id, status: "accepted" },
    ]);

    // 5. Also connect demoUser with Bumble Bee bot
    const bot = await User.findOne({ isBot: true });
    if (bot) {
      await FriendRequest.create({ senderId: demoUser._id, receiverId: bot._id, status: "accepted" });
    }

    // Helper: create a sequence of messages with staggered timestamps
    const seedChat = async (partnerA, partnerB, lines) => {
      const now = Date.now();
      const bulk = lines.map(([from, text], i) => ({
        senderId: from === 'user' ? demoUser._id : partnerA._id,
        receiverId: from === 'user' ? partnerA._id : demoUser._id,
        text,
        isGroupMessage: false,
        createdAt: new Date(now - (lines.length - i) * 3 * 60 * 1000), // 3 min apart
        updatedAt: new Date(now - (lines.length - i) * 3 * 60 * 1000),
      }));
      await Message.insertMany(bulk);
    };

    // Alice — design / casual chat
    await seedChat(alice, demoUser, [
      ['peer', "Hey! Did you check out the new Figma update? 🎨"],
      ['user',  "Not yet, what's new in it?"],
      ['peer', "They added AI-powered layout suggestions. Kinda wild honestly"],
      ['user',  "Sounds useful! I'll check it out later"],
      ['peer', "Yeah let me know what you think. Also — are we still on for the design review Friday?"],
      ['user',  "Yep, 2 PM works for me 👍"],
      ['peer', "Perfect. I'll send the Figma link before then"],
    ]);

    // Liam — tech / dev chat
    await seedChat(liam, demoUser, [
      ['peer', "Yo, have you tried the new Vite 6 release?"],
      ['user',  "Just saw the changelog. HMR changes look 🔥"],
      ['peer', "It's so fast now. Cold start is almost instant"],
      ['user',  "I might migrate the side project this weekend"],
      ['peer', "Do it. Let me know if you hit any breaking changes, I already migrated two projects"],
      ['user',  "Appreciate it, will ping you 🤙"],
    ]);

    // Sophie — friendly / personal chat
    await seedChat(sophie, demoUser, [
      ['peer', "Just landed in Lisbon 🇵🇹 it's gorgeous here"],
      ['user',  "No way! How long are you staying?"],
      ['peer', "A week. The light here is perfect for photography"],
      ['user',  "I'm so jealous 😂 send pics!"],
      ['peer', "Haha will do. You should come next time, it's super affordable"],
      ['user',  "Adding it to my list 📋"],
    ]);

    // Bumble Bee welcome
    if (bot) {
      await Message.create({
        senderId: bot._id,
        receiverId: demoUser._id,
        text: "Hi there! 👋 I'm Bumble Bee, your AI assistant on Talklet. This is a 15-minute demo session — feel free to explore. Your data resets automatically when it ends.",
        isGroupMessage: false,
      });
    }

    // 6. Return token
    const token = generateToken(demoUser._id);
    res.json({ success: true, userData: demoUser, token, message: "Demo session started!" });
  } catch (err) {
    console.error("[Demo] Error:", err);
    res.status(500).json({ success: false, message: "Failed to start demo session" });
  }
};

