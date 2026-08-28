import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  fullName: { type: String, required: true },
  password: { type: String, minlength: 6 },
  profilePic: { type: String, default: "" },
  bio: { type: String },
  backgroundImage: { type: String, default: "" },
  isBot: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  // Links demo users to their session for isolation & cleanup
  demoSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "DemoSession", default: null }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
