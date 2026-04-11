const Message = require("./models/Message");
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

/* ================= ONLINE USERS ================= */

let onlineUsers = new Map();

/* ================= SOCKET CONNECTION ================= */

io.on("connection", (socket) => {

  console.log("⚡ User connected:", socket.id);

  /* ================= USER SETUP ================= */

  socket.on("setup", (userData) => {

    if (!userData || !userData._id) return;

    const userId = userData._id;

    socket.join(userId);

    onlineUsers.set(userId, socket.id);

    console.log("🟢 User online:", userId);

    const users = Array.from(onlineUsers.keys());

    io.emit("online users", users);

    socket.emit("connected");

  });

  /* ================= JOIN CHAT ROOM ================= */

  socket.on("join chat", (room) => {

    socket.join(room);

    console.log("💬 Joined chat:", room);

  });

  /* ================= TYPING EVENTS ================= */

  socket.on("typing", (room) => {

    socket.to(room).emit("typing");

  });

  socket.on("stop typing", (room) => {

    socket.to(room).emit("stop typing");

  });

  /* ================= NEW MESSAGE ================= */

  socket.on("new message", (message) => {

  const chat = message.chat;

  if (!chat || !chat._id) return;

  socket.to(chat._id).emit("message received", message);

});
 /* ================= MESSAGE DELIVERED ================= */

socket.on("message received", async (message) => {
  await Message.findByIdAndUpdate(message._id, {
    status: "delivered"
  });

  socket.emit("message delivered", message._id);
});

 /* ================= MESSAGE SEEN ================= */

socket.on("message seen", async (chatId) => {
  await Message.updateMany(
    { chat: chatId, status: { $ne: "seen" } },
    { status: "seen" }
  );

  socket.emit("messages seen", chatId);
});

  /* ================= EDIT MESSAGE ================= */

 socket.on("edit message", (message) => {

  const chat = message.chat;

  if (!chat || !chat._id) return;

  socket.to(chat._id).emit("message edited", message);

});

  /* ================= DELETE MESSAGE ================= */

 socket.on("delete message", (data) => {

  const { messageId, chatId } = data;

  if (!chatId) return;

  socket.to(chatId).emit("message deleted", {
    messageId,
    chatId
  });

});
  /* ================= DISCONNECT ================= */

  socket.on("disconnect", () => {

    console.log("🔴 User disconnected:", socket.id);

    for (let [userId, socketId] of onlineUsers.entries()) {

      if (socketId === socket.id) {

        onlineUsers.delete(userId);

        console.log("User removed from online list:", userId);

        break;

      }

    }

    const users = Array.from(onlineUsers.keys());

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

