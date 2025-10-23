import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  fullName: { type: String, required: true },
  password: { type: String, minlength: 6 },
  profilePic: { type: String, default: "" },
  bio: { type: String },
  backgroundImage: { type: String, default: "" },
  isBot: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
