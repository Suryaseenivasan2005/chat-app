import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import { Server } from "socket.io"

// Create Express App and HTTp server
const app = express();
const server = http.createServer(app)

// Initalize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// store online users
export const userSocketMap = {}; //{userId : socketId}

// Socket.io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("user Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    // emmit online users to all  connectedclients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

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
    
    // Voice call events
    socket.on("call_initiate", ({ to, caller, receiver, offer }) => {
        if (!to) return;
        const toSocket = userSocketMap[to];
        if (toSocket) io.to(toSocket).emit("call_initiate", { from: userId, caller, receiver, offer });
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

    socket.on("disconnect",()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
// Update the CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://vettipechu.vercel.app" ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Routes setup
app.use("/api/status", (req,res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)

// Modify the part where you connect to MongoDB and start the server

// Connect to MongoDB first, then start the server
const startServer = async () => {
  if(process.env.NODE_ENV !== "production"){
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));
    } catch (error) {
        console.log("Failed to start server:", error);
        process.exit(1);
    }
};
};

// Export server for vercel

export default server;

startServer();

// // # Install Claude Code
// npm install -g @anthropic-ai/claude-code

// # Navigate to your project
// cd your-awesome-project

// # Start coding with Claude
// claude
// # You'll be prompted to log in on first use

// Schedule message cleanup (run daily)
const cleanupMessages = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    // For each conversation, keep the last 3 messages from each user
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: {
          conversation: { $cond: [{ $gt: ["$isGroupMessage", false] }, 
                        { $concat: [{ $min: ["$senderId", "$receiverId"] }, "-", { $max: ["$senderId", "$receiverId"] }] }, 
                        "$receiverId"] },
          sender: "$senderId"
        },
        messages: { $push: "$_id" }
      }},
      { $project: {
        _id: 0,
        conversation: "$_id.conversation",
        sender: "$_id.sender",
        keepMessages: { $slice: ["$messages", 3] }
      }}
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