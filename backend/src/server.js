const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/database");
const { socketAuthMiddleware } = require("./middlewares/auth");
const conversationService = require("./services/conversationService");
const User = require("./models/User");

const apiRoutes = require("./routes/apiRoute");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:5000", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:5000", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.json({
    message: "Chat API is running!",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: "MongoDB",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api", apiRoutes);

const onlineUsers = new Map();

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  onlineUsers.set(socket.userId, socket.id);

  User.findByIdAndUpdate(socket.userId, {
    status: "online",
    lastSeen: new Date(),
  }).exec();

  socket.broadcast.emit("user_online", {
    userId: socket.userId,
    status: "online",
  });

  socket.join(`user:${socket.userId}`);

  socket.on("join_conversation", async (data) => {
    try {
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);

      await conversationService.markAsRead(conversationId, socket.userId);
      socket.emit("conversation_joined", { conversationId });
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("leave_conversation", (data) => {
    const { conversationId } = data;
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { conversationId, content } = data;

      const message = await conversationService.sendMessage(
        conversationId,
        socket.userId,
        content,
      );

      io.to(`conversation:${conversationId}`).emit("receive_message", {
        conversationId,
        message: {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createAt,
          readBy: message.readBy,
        },
      });

      const conversation = await conversationService
        .createGroupConversation(socket.userId)
        .then((convers) =>
          convers.find((c) => c._id.toString() === conversationId),
        );

      if (conversation) {
        conversation.participants.forEach((participant) => {
          const participantId = participant._id.toString();
          if (
            participantId !== socket.userId &&
            !onlineUsers.has(participantId)
          ) {
            console.log(
              `User ${participantId} is offline, would send notification`,
            );
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("typing", async (data) => {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit("user_typing", {
      conversationId,
      userId: socket.userId,
      user: socket.user,
    });
  });

  socket.on("stop_typing", (data) => {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
      conversationId,
      userId: socket.userId,
    });
  });

  socket.on("friend_request_sent", async (data) => {
    const { targetUserId } = data;
    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(`user:${targetUserId}`).emit("friend_request_received", {
        from: socket.user,
      });
    }
  });

  socket.on("friend_request_accepted", async (data) => {
    const { targetUserId } = data;

    io.to(`user:${targetUserId}`).emit("friend_request_accepted", {
      friend: socket.user,
    });
  });

  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.userId);

    onlineUsers.delete(socket.userId);

    await User.findByIdAndUpdate(socket.userId, {
      status: "offline",
      lastSeen: new Date(),
    });

    socket.broadcast.emit("user_offline", {
      userId: socket.userId,
      status: "offline",
      lastSeen: new Date(),
    });
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
