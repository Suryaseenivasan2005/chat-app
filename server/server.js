import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import friendRouter from "./routes/friendRoutes.js";
import Message from "./models/message.js";

// Create Express App and HTTp server
const app = express();
const server = http.createServer(app);

// Shared allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://talklet.app",
  "https://www.talklet.app",
  "https://talklet-beta.vercel.app"
];

// Initialize socket.io server with proper CORS and timeout settings
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// store online users
export const userSocketMap = {}; //{userId : socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // typing indicator events
  socket.on("typing", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("typing", { from: userId });
  });
  socket.on("stop_typing", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("stop_typing", { from: userId });
  });
  socket.on("recording", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("recording", { from: userId });
  });
  socket.on("stop_recording", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("stop_recording", { from: userId });
  });

  // Voice / Video call events
  socket.on("call_initiate", ({ to, caller, receiver, offer, isVideoCall }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_initiate", { from: userId, caller, receiver, offer, isVideoCall });
  });

  socket.on("call_offer", ({ to, offer }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_offer", { from: userId, offer });
  });

  socket.on("call_answer", ({ to, answer }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_answer", { from: userId, answer });
  });

  socket.on("call_ice_candidate", ({ to, candidate }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_ice_candidate", { from: userId, candidate });
  });

  socket.on("call_ended", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_ended", { from: userId });
  });

  socket.on("call_rejected", ({ to }) => {
    if (!to) return;
    const toSocket = userSocketMap[to];
    if (toSocket) io.to(toSocket).emit("call_rejected", { from: userId });
  });

  socket.on("disconnect", () => {
    if (userId) {
      console.log("User Disconnected:", userId);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));

// Express CORS setup
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  maxAge: 86400, // 24 hours
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);
app.use("/api/friends", friendRouter);

// Schedule message cleanup (run daily)
const cleanupMessages = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // For each conversation, keep the last 3 messages from each user
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            conversation: {
              $cond: [{ $gt: ["$isGroupMessage", false] },
              { $concat: [{ $min: ["$senderId", "$receiverId"] }, "-", { $max: ["$senderId", "$receiverId"] }] },
                "$receiverId"]
            },
            sender: "$senderId"
          },
          messages: { $push: "$_id" }
        }
      },
      {
        $project: {
          _id: 0,
          conversation: "$_id.conversation",
          sender: "$_id.sender",
          keepMessages: { $slice: ["$messages", 3] }
        }
      }
    ]);

    // Collect IDs of messages to keep
    const messagesToKeep = [];
    conversations.forEach(conv => {
      messagesToKeep.push(...conv.keepMessages);
    });

    // Delete old messages except those to keep
    const result = await Message.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      _id: { $nin: messagesToKeep }
    });

    console.log(`Deleted ${result.deletedCount} old messages`);
  } catch (error) {
    console.error('Error cleaning up messages:', error);
  }
};

// Run cleanup once a day
setInterval(cleanupMessages, 24 * 60 * 60 * 1000);

// Connect to MongoDB using generic start logic
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();