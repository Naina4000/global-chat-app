const express = require("express");
const Chat = require("../models/Chat");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
   CREATE OR ACCESS PRIVATE CHAT
*/

router.post("/", authMiddleware, async (req, res) => {
  try {

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "UserId param not sent"
      });
    }

    // Check if chat already exists
    let chat = await Chat.find({
      isGroupChat: false,
      users: { $all: [req.user.id, userId] }
    })
      .populate("users", "-password")
      .populate("lastMessage");

    if (chat.length > 0) {
      return res.json(chat[0]);
    }

    // Create new chat
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user.id, userId]
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate("users", "-password");

    res.status(201).json(fullChat);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
