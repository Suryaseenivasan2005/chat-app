import bcrypt from "bcryptjs";
import DemoSession from "../models/DemoSession.js";
import User from "../models/User.js";
import Message from "../models/message.js";
import FriendRequest from "../models/FriendRequest.js";
import { generateToken } from "../lib/utils.js";

const DEMO_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Fake peer definitions ──────────────────────────────────────────────────────
const DEMO_PEERS = [
  {
    fullName: "Alex Morgan",
    bio: "Designer & coffee lover ☕",
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    responses: [
      "Oh nice! That reminds me of the Figma update I was working on 🎨",
      "Haha, totally! I had a similar experience last week.",
      "That's a great point! Have you tried the new layout tool?",
      "Love it! Let me know if you need any design feedback.",
      "Sounds cool! I'll check it out when I'm free later 😊",
      "Right? The latest color palette trend is wild.",
    ],
  },
  {
    fullName: "Sarah Williams",
    bio: "Full-stack dev | open source 🛠️",
    profilePic: "https://randomuser.me/api/portraits/women/32.jpg",
    responses: [
      "Interesting! Have you tried the new Vite 6 release for that?",
      "Yeah, that's a common pattern in React. Pretty elegant solution.",
      "Nice! I pushed something similar to my open-source repo last week.",
      "Makes sense. The bundle size difference is huge 🔥",
      "That's exactly the kind of thing I'd add to my starter template.",
      "Oh cool, I was just reading about that in the React docs!",
    ],
  },
  {
    fullName: "Arjun Kumar",
    bio: "ML engineer, cricket fan 🏏",
    profilePic: "https://randomuser.me/api/portraits/men/22.jpg",
    responses: [
      "Makes sense. The complexity would be O(n log n) for that approach 🤔",
      "Interesting! Is it a supervised or unsupervised learning problem?",
      "Nice one! I've been experimenting with something similar in PyTorch.",
      "That's a solid approach. Have you benchmarked it against the baseline?",
      "True! Though the data preprocessing is always the tricky part 😅",
      "Haha, exactly how I felt watching the last IPL match too!",
    ],
  },
  {
    fullName: "Maya Patel",
    bio: "Travel & photography 📸",
    profilePic: "https://randomuser.me/api/portraits/women/68.jpg",
    responses: [
      "Oh wow, that sounds amazing! You should totally try it 🌍",
      "Haha, that's exactly how Lisbon felt when I visited last month 😄",
      "The light this time of year is just perfect for photography!",
      "I'm so jealous 😂 Send me pics when you get a chance!",
      "Adding that to my travel list immediately! Thanks for the tip 📋",
      "Right?! Every city has that one hidden gem nobody talks about.",
    ],
  },
  {
    fullName: "Daniel Thomas",
    bio: "Fitness & health 💪",
    profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
    responses: [
      "That's the mindset bro! Same energy I need before leg day 💪",
      "Consistency is everything. You'll see the results in 4-6 weeks!",
      "Nice! What split are you running? Push/pull/legs?",
      "Haha same! I always skip rest days and then regret it 😅",
      "Dude, protein intake is so underrated. You tracking macros?",
      "Let's go! See you at the gym tonight 🏋️",
    ],
  },
  {
    fullName: "Priya Sharma",
    bio: "Product Manager | bookworm 📚",
    profilePic: "https://randomuser.me/api/portraits/women/12.jpg",
    responses: [
      "Good point! I'll add that to the sprint notes 📋",
      "That aligns perfectly with what the users were saying in the feedback session.",
      "Love that idea! Let's put it in the backlog and prioritize next quarter.",
      "I just finished reading about that exact pattern in Inspired 📚",
      "Yeah, I was thinking the same. Shall I set up a quick sync?",
      "Great observation! That's exactly the user pain point we need to solve.",
    ],
  },
];

// ── Sample seed conversations ──────────────────────────────────────────────────
const SEED_CHATS = {
  "Alex Morgan": [
    ["peer", "Hey! Did you check out the new Figma update? 🎨"],
    ["user", "Not yet, what's new in it?"],
    ["peer", "They added AI-powered layout suggestions. Kinda wild honestly"],
    ["user", "Sounds useful! I'll check it out later"],
    ["peer", "Yeah let me know what you think. Also — are we still on for the design review Friday?"],
    ["user", "Yep, 2 PM works for me 👍"],
    ["peer", "Perfect. I'll send the Figma link before then"],
  ],
  "Sarah Williams": [
    ["peer", "The deployment finally worked 😂"],
    ["user", "Seriously? That's great!"],
    ["peer", "Yeah, took me forever. CORS issues are the bane of my existence"],
    ["user", "Haha I feel that. Which stack?"],
    ["peer", "Node + Vite. Finally switched to v6 and it's so much faster"],
    ["user", "Nice, I've been meaning to migrate too"],
  ],
  "Arjun Kumar": [
    ["peer", "Can you send me the notes from yesterday's session?"],
    ["user", "Sure, I'll send them tonight"],
    ["peer", "Thanks! Also, have you started the ML assignment?"],
    ["user", "Just the preprocessing part. The model training is next"],
    ["peer", "Same. Let me know if you want to pair on the validation logic"],
  ],
  "Maya Patel": [
    ["peer", "Just landed in Lisbon 🇵🇹 it's gorgeous here"],
    ["user", "No way! How long are you staying?"],
    ["peer", "A week. The light here is perfect for photography"],
    ["user", "I'm so jealous 😂 send pics!"],
    ["peer", "Haha will do! You should come next time, it's super affordable"],
    ["user", "Adding it to my list 📋"],
  ],
  "Daniel Thomas": [
    ["peer", "Are you hitting the gym today?"],
    ["user", "Probably around 6 PM, why?"],
    ["peer", "Leg day for me. Was wondering if you wanted to spot me on squats."],
    ["user", "Sure! See you at 6."],
    ["peer", "Awesome, appreciate it man. Don't skip warm-up this time 😅"],
  ],
  "Priya Sharma": [
    ["peer", "Did you see the email about the Q3 roadmap?"],
    ["user", "Just read it. Looks like a lot to cover."],
    ["peer", "Yeah, I'm setting up a sync for tomorrow to go over priorities."],
    ["user", "Sounds good, send the invite."],
    ["peer", "Done! Catch you tomorrow 👋"],
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Clean up ALL data belonging to a demo session:
 * messages → friend requests → demo peer users → demo user
 */
export const cleanupDemoSession = async (session) => {
  if (!session) return;
  const allDemoUserIds = [session.demoUserId, ...session.peerIds];

  await Message.deleteMany({ demoSessionId: session._id });
  await FriendRequest.deleteMany({
    $or: [
      { senderId: { $in: allDemoUserIds } },
      { receiverId: { $in: allDemoUserIds } },
    ],
  });
  await User.deleteMany({ demoSessionId: session._id });
};

/**
 * Create a full set of demo users + seed messages for a session.
 * Returns { demoUser, peers, bot }
 */
const seedDemoSession = async (session) => {
  const ts = Date.now();
  const password = await bcrypt.hash("demo_internal_pass_" + ts, 6);

  // Find the shared Bumble Bee bot
  let bot = await User.findOne({ isBot: true });
  if (!bot) {
    bot = await User.create({
      fullName: "Bumble Bee",
      profilePic: "/static/chitti.jpg",
      bio: "May I help you?",
      isBot: true,
    });
  }

  // Create the visitor's demo user
  const demoUser = await User.create({
    fullName: "Guest Explorer",
    email: `demo_${ts}@talklet.demo`,
    password,
    bio: "👀 Exploring Talklet in Demo Mode",
    profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${ts}`,
    isDemo: true,
    demoSessionId: session._id,
  });

  // Create the 6 fake peer users
  const peerDocs = await User.insertMany(
    DEMO_PEERS.map((p, i) => ({
      fullName: p.fullName,
      email: `${p.fullName.split(" ")[0].toLowerCase()}_${ts}_${i}@talklet.demo`,
      password,
      bio: p.bio,
      profilePic: p.profilePic,
      isDemo: true,
      demoSessionId: session._id,
    }))
  );

  // Map peer names to their doc IDs for seeding
  const peerByName = {};
  peerDocs.forEach((doc) => { peerByName[doc.fullName] = doc; });

  // Create accepted friendships: demoUser ↔ each peer + bot
  const friendEntries = peerDocs.map((peer) => ({
    senderId: demoUser._id,
    receiverId: peer._id,
    status: "accepted",
  }));
  friendEntries.push({ senderId: demoUser._id, receiverId: bot._id, status: "accepted" });
  await FriendRequest.insertMany(friendEntries);

  // Seed conversations
  const now = Date.now();
  const allMessages = [];

  for (const [peerName, lines] of Object.entries(SEED_CHATS)) {
    const peerDoc = peerByName[peerName];
    if (!peerDoc) continue;
    lines.forEach(([from, text], i) => {
      allMessages.push({
        senderId: from === "user" ? demoUser._id : peerDoc._id,
        receiverId: from === "user" ? peerDoc._id : demoUser._id,
        text,
        seen: true,
        demoSessionId: session._id,
        createdAt: new Date(now - (lines.length - i) * 4 * 60 * 1000),
        updatedAt: new Date(now - (lines.length - i) * 4 * 60 * 1000),
      });
    });
  }

  // Bumble Bee welcome message
  allMessages.push({
    senderId: bot._id,
    receiverId: demoUser._id,
    text: "Hi there! 👋 I'm Bumble Bee, your AI assistant on Talklet. This is a 15-minute demo — feel free to explore. Ask me anything!",
    seen: true,
    demoSessionId: session._id,
    createdAt: new Date(now - 2 * 60 * 1000),
    updatedAt: new Date(now - 2 * 60 * 1000),
  });

  await Message.insertMany(allMessages);

  return { demoUser, peers: peerDocs, bot };
};

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * POST /api/demo/init
 * Creates a PENDING demo session + all demo data.
 * Timer has NOT started yet. Returns a short-lived pending token.
 */
export const initDemo = async (req, res) => {
  try {
    // Clean up any old expired sessions first
    const fifteenMinsAgo = new Date(Date.now() - DEMO_DURATION_MS);
    const expiredSessions = await DemoSession.find({
      status: "active",
      expiresAt: { $lt: new Date() },
    });
    for (const s of expiredSessions) {
      s.status = "expired";
      await s.save();
    }

    // Also clean up stale 'pending' sessions older than 30 min (never activated)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const stalePending = await DemoSession.find({ status: "pending", createdAt: { $lt: thirtyMinsAgo } });
    for (const s of stalePending) {
      await cleanupDemoSession(s);
      await DemoSession.deleteOne({ _id: s._id });
    }

    // Create a pending session shell
    const session = await DemoSession.create({ demoUserId: null, status: "pending" });

    // Seed demo data
    const { demoUser, peers, bot } = await seedDemoSession(session);

    // Link users back to session
    session.demoUserId = demoUser._id;
    session.peerIds = peers.map((p) => p._id);
    session.botId = bot._id;
    await session.save();

    // Issue a PENDING token (no expiresAt yet)
    const token = generateToken(demoUser._id, {
      isDemo: true,
      demoSessionId: session._id,
    });

    res.json({
      success: true,
      token,
      userData: demoUser,
      sessionId: session._id,
      message: "Demo session initialized",
    });
  } catch (err) {
    console.error("[Demo] Init error:", err);
    res.status(500).json({ success: false, message: "Failed to initialize demo session" });
  }
};

/**
 * POST /api/demo/start
 * Transitions a PENDING session to ACTIVE and sets the 15-min expiry.
 * This is called when the visitor clicks CONTINUE DEMO.
 */
export const startDemo = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const session = await DemoSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    if (session.status === "expired") {
      return res.status(400).json({ success: false, message: "Session already expired" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_DURATION_MS);
    session.status = "active";
    session.expiresAt = expiresAt;
    await session.save();

    const demoUser = await User.findById(session.demoUserId).select("-password");

    // Issue the active token with expiresAt embedded so client timer is accurate
    const token = generateToken(demoUser._id, {
      isDemo: true,
      demoSessionId: session._id,
      expiresAt: expiresAt.getTime(),
    });

    res.json({
      success: true,
      token,
      userData: demoUser,
      expiresAt: expiresAt.getTime(),
      message: "Demo session started!",
    });
  } catch (err) {
    console.error("[Demo] Start error:", err);
    res.status(500).json({ success: false, message: "Failed to start demo session" });
  }
};

/**
 * POST /api/demo/reset
 * Wipes all current session data and re-seeds it. Resets the 15-min timer.
 */
export const resetDemo = async (req, res) => {
  try {
    // req.demoSession is attached by protectRoute
    const session = req.demoSession;
    if (!session) {
      return res.status(400).json({ success: false, message: "No active demo session" });
    }

    // Delete all data from this session
    await cleanupDemoSession(session);

    // Re-seed fresh data
    const { demoUser, peers, bot } = await seedDemoSession(session);

    // Reset session fields
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_DURATION_MS);
    session.demoUserId = demoUser._id;
    session.peerIds = peers.map((p) => p._id);
    session.botId = bot._id;
    session.expiresAt = expiresAt;
    session.status = "active";
    session.bumblebeeRequestCount = 0;
    await session.save();

    // Issue a fresh token
    const token = generateToken(demoUser._id, {
      isDemo: true,
      demoSessionId: session._id,
      expiresAt: expiresAt.getTime(),
    });

    res.json({
      success: true,
      token,
      userData: demoUser,
      expiresAt: expiresAt.getTime(),
      message: "Demo session reset!",
    });
  } catch (err) {
    console.error("[Demo] Reset error:", err);
    res.status(500).json({ success: false, message: "Failed to reset demo session" });
  }
};

/**
 * GET /api/demo/session
 * Returns the current session status + remaining time.
 * Used on page refresh to recover the accurate timer.
 */
export const getSession = async (req, res) => {
  try {
    const session = req.demoSession;
    const now = Date.now();
    const timeLeft = session?.expiresAt ? Math.max(0, new Date(session.expiresAt).getTime() - now) : 0;

    res.json({
      success: true,
      status: session?.status,
      expiresAt: session?.expiresAt?.getTime() ?? null,
      timeLeft,
    });
  } catch (err) {
    console.error("[Demo] Session error:", err);
    res.status(500).json({ success: false, message: "Failed to get session info" });
  }
};

/**
 * Cleanup job — called periodically from server.js
 * Marks overdue active sessions as expired and wipes their data.
 */
export const cleanupExpiredSessions = async () => {
  try {
    const overdue = await DemoSession.find({
      status: "active",
      expiresAt: { $lt: new Date() },
    });

    for (const session of overdue) {
      await cleanupDemoSession(session);
      await DemoSession.deleteOne({ _id: session._id });
    }

    // Also nuke stale pending sessions (older than 30 min, never activated)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const stalePending = await DemoSession.find({ status: "pending", createdAt: { $lt: thirtyMinsAgo } });
    for (const s of stalePending) {
      await cleanupDemoSession(s);
      await DemoSession.deleteOne({ _id: s._id });
    }

    if (overdue.length + stalePending.length > 0) {
      console.log(`[Demo Cleanup] Removed ${overdue.length} expired + ${stalePending.length} stale sessions.`);
    }
  } catch (err) {
    console.error("[Demo Cleanup] Error:", err);
  }
};

/**
 * Helper: get the fake peer response for a given sender name.
 * Called from messageController when demo user messages a non-bot peer.
 */
export const getFakePeerResponse = (peerFullName) => {
  const peer = DEMO_PEERS.find((p) => p.fullName === peerFullName);
  if (!peer) return "Got it! 👍";
  const replies = peer.responses;
  return replies[Math.floor(Math.random() * replies.length)];
};
