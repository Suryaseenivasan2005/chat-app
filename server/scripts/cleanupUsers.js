import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Message from "../models/message.js";
import Group from "../models/group.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function cleanupUsers() {
  try {
    console.log("Starting user cleanup process...");
    
    // Find VettiBot user
    const vettiBot = await User.findOne({ isBot: true });
    
    if (!vettiBot) {
      console.error("VettiBot not found! Aborting cleanup.");
      process.exit(1);
    }
    
    console.log(`Found VettiBot: ${vettiBot.fullName} (${vettiBot._id})`);
    
    // Find all users except VettiBot
    const usersToDelete = await User.find({ _id: { $ne: vettiBot._id } });
    console.log(`Found ${usersToDelete.length} users to delete`);
    
    // Get IDs of users to delete
    const userIdsToDelete = usersToDelete.map(user => user._id);
    
    // Delete all messages associated with these users
    const deletedMessages = await Message.deleteMany({
      $or: [
        { senderId: { $in: userIdsToDelete } },
        { receiverId: { $in: userIdsToDelete } }
      ]
    });
    
    console.log(`Deleted ${deletedMessages.deletedCount} messages`);
    
    // Remove users from groups or delete groups
    const groups = await Group.find({});
    let groupsDeleted = 0;
    let groupsUpdated = 0;
    
    for (const group of groups) {
      // If all members are being deleted, delete the group
      const remainingMembers = group.members.filter(
        memberId => !userIdsToDelete.some(id => id.equals(memberId))
      );
      
      if (remainingMembers.length === 0) {
        await Group.deleteOne({ _id: group._id });
        groupsDeleted++;
      } else {
        // Update group to remove deleted users
        await Group.updateOne(
          { _id: group._id },
          { $pull: { members: { $in: userIdsToDelete } } }
        );
        groupsUpdated++;
      }
    }
    
    console.log(`Deleted ${groupsDeleted} groups and updated ${groupsUpdated} groups`);
    
    // Finally delete the users
    const deletedUsers = await User.deleteMany({ _id: { $in: userIdsToDelete } });
    
    console.log(`Deleted ${deletedUsers.deletedCount} users`);
    console.log("Cleanup completed successfully!");
    
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the cleanup function
cleanupUsers();