const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cors());

/* ================= ROUTES ================= */

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api/auth", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

/* ================= DATABASE ================= */

mongoose
  .connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

/* ================= CREATE SERVER ================= */

const server = http.createServer(app);

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ================= ONLINE USERS STORE ================= */

let onlineUsers = new Map();

/* ================= SOCKET CONNECTION ================= */

io.on("connection", (socket) => {

  console.log("⚡ User connected:", socket.id);

  /* ================= USER SETUP ================= */

  socket.on("setup", (userData) => {

    if (!userData || !userData._id) return;

    const userId = userData._id;

    socket.join(userId);

    /* SAVE ONLINE USER */

    onlineUsers.set(userId, socket.id);

    console.log("🟢 User online:", userId);

    const users = Array.from(onlineUsers.keys());

    console.log("ONLINE USERS:", users);

    io.emit("online users", users);

    socket.emit("connected");

  });

  /* ================= JOIN CHAT ROOM ================= */

  socket.on("join chat", (room) => {

    socket.join(room);

    console.log("💬 Joined chat room:", room);

  });

  /* ================= NEW MESSAGE ================= */

  socket.on("new message", (message) => {

    const chat = message.chat;

    if (!chat || !chat.users) return;

    chat.users.forEach((user) => {

      const userId = user._id || user;

      if (userId == message.sender._id) return;

      socket.to(userId).emit("message received", message);

    });

  });

  /* ================= DISCONNECT ================= */

  socket.on("disconnect", () => {

    console.log("🔴 User disconnected:", socket.id);

    /* REMOVE USER FROM ONLINE LIST */

    for (let [userId, socketId] of onlineUsers.entries()) {

      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log("User removed from online list:", userId);
        break;
      }

    }

    const users = Array.from(onlineUsers.keys());

    console.log("ONLINE USERS:", users);

    io.emit("online users", users);

  });

});

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("🚀 Chat API running...");
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
