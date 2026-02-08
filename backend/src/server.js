const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const messageService = require("./services/messageService");
const apiRoutes = require("./routes/apiRoute");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:8080",
            "http://localhost:5000",
            "http://localhost:3000",
          ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:8080",
            "http://localhost:5000",
            "http://localhost:3000",
          ],
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

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);

  socket.on("join_room", async (data) => {
    try {
      const roomName = data.room || data;
      const username = data.username || "Anonymous";

      socket.join(roomName);
      console.log(`User ${username} has joined room: ${roomName}`);

      if (!onlineUsers.has(roomName)) {
        onlineUsers.set(roomName, new Set());
      }
      onlineUsers.get(roomName).add(socket.id);

      await messageService.getOrCreateRoom(roomName);

      const messages = await messageService.getMessage(roomName);
      socket.emit("message_history", {
        room: roomName,
        messages,
      });

      const onlineCount = onlineUsers.get(roomName).size;
      io.to(roomName).emit("online_users", {
        count: onlineCount,
      });

      socket.to(roomName).emit("user_joined", {
        userId: socket.id,
        username,
        message: `${username} joined room`,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("send_message", async (data) => {
    try {
      console.log("Message received:", data);
      if (!data.message || !data.room) {
        console.error("Missing required fields");
        socket.emit("error", { message: "Message and room are required" });
        return;
      }
      const savedMessage = await messageService.saveMessage(
        data.room,
        {
          content: data.message,
          username: data.username || "Anonymous",
        },
        socket.id,
      );

      io.to(data.room).emit("receive_message", {
        _id: savedMessage._id,
        message: savedMessage.message,
        userId: savedMessage.userId,
        username: savedMessage.username,
        timestamp: savedMessage.timestamp,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("user_typing", {
      username: data.username,
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("user_stop_typing", {
      username: data.username,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    onlineUsers.forEach((users, roomName) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);

        io.to(roomName).emit("online_users", {
          count: users.size,
        });

        if (users.size === 0) {
          onlineUsers.delete(roomName);
        }
      }
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
