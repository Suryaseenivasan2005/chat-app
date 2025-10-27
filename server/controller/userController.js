import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
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

    // Find all users except current user and bots
    const users = await User.find({
      _id: { $ne: currentUserId },
      isBot: { $ne: true }
    })
    .select('fullName email bio profilePic') // Select only needed fields
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
