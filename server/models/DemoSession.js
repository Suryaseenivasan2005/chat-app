import mongoose from "mongoose";

const demoSessionSchema = new mongoose.Schema({
  // The visitor's demo user (the "Guest Explorer" account)
  demoUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // ObjectIds of the 6 fake peer users created for this session
  peerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // The ObjectId of the Bumble Bee bot (shared singleton)
  botId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // 'pending' = intro shown, timer not started
  // 'active'  = visitor clicked CONTINUE, 15-min window open
  // 'expired' = time ran out or was manually invalidated
  status: {
    type: String,
    enum: ["pending", "active", "expired"],
    default: "pending",
  },

  // Set only when status transitions to 'active'
  expiresAt: { type: Date, default: null },

  // Rate-limit for Gemini AI calls (max 20 per session)
  bumblebeeRequestCount: { type: Number, default: 0 },
}, { timestamps: true });

// Index so we can quickly clean up expired sessions
demoSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "expired" } });

const DemoSession = mongoose.model("DemoSession", demoSessionSchema);

export default DemoSession;
