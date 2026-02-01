import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import friendRouter from "./routes/friendRoutes.js";
import { Server } from "socket.io"

// Create Express App and HTTp server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server with proper CORS and timeout settings
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://talklet-beta.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
})

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
})

// Middleware setup
app.use(express.json({ limit: "4mb" }));
// Update the CORS configuration with enhanced security
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://talklet-beta.vercel.app"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  maxAge: 86400, // 24 hours
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/users", userRouter); // Add this line for user routes
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);
app.use("/api/friends", friendRouter);

// Modify the part where you connect to MongoDB and start the server

// Connect to MongoDB first, then start the server
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

// In production (Vercel) we shouldn't call `server.listen` because Vercel
// handles the server lifecycle. But we must ensure a MongoDB connection is
// initiated so Mongoose does not buffer operations and timeout. Start the
// DB connection on module load and only start the HTTP listener in
// development.
if (process.env.NODE_ENV !== 'production') {
  // Development: connect and then start the HTTP server
  startServer();
} else {
  // Production (Vercel): initiate DB connection but do not call listen()
  connectDB().catch((err) => {
    console.error('Failed to connect to MongoDB in production:', err);
  });
}

// Export server for Vercel
export default server;

// // # Install Claude Code
// npm install -g @anthropic-ai/claude-code

// # Navigate to your project
// cd your-awesome-project

// # Start coding with Claude
// claude
// # You'll be prompted to log in on first use

// Import Message model
import Message from "./models/message.js";

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