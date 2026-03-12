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
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

/* ================= EXPRESS SERVER ================= */

const server = http.createServer(app);

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {

  console.log("⚡ User connected:", socket.id);

  /* USER SETUP */
  socket.on("setup", (userData) => {

    socket.join(userData._id);
    console.log("User joined personal room:", userData._id);

    socket.emit("connected");
  });

  /* JOIN CHAT ROOM */
  socket.on("join chat", (room) => {

    socket.join(room);
    console.log("Joined chat room:", room);

  });

  /* NEW MESSAGE */
  socket.on("new message", (message) => {

    const chat = message.chat;

    if (!chat.users) return;

    chat.users.forEach((user) => {

      if (user._id == message.sender._id) return;

      socket.to(user._id).emit("message received", message);

    });

  });

  /* DISCONNECT */
  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

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
