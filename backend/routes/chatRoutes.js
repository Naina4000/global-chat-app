const express = require("express");
const Chat = require("../models/Chat");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
ACCESS OR CREATE PRIVATE CHAT
*/
router.post("/", authMiddleware, async (req, res) => {
  try {

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "UserId param not sent"
      });
    }

    let chat = await Chat.find({
      isGroupChat: false,
      users: { $all: [req.user.id, userId] }
    })
      .populate("users", "-password")
      .populate("lastMessage");

    if (chat.length > 0) {
      return res.json(chat[0]);
    }

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


/*
CREATE GROUP CHAT
*/
router.post("/group", authMiddleware, async (req, res) => {
  try {

    const { name, users } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        message: "Please provide group name and users"
      });
    }

    if (!Array.isArray(users)) {
      return res.status(400).json({
        message: "Users must be an array"
      });
    }

    const allUsers = [...users, req.user.id];

    const groupChat = await Chat.create({
      chatName: name,
      users: allUsers,
      isGroupChat: true,
      groupAdmin: req.user.id
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;

/*
FETCH ALL CHATS FOR USER
*/

router.get("/", authMiddleware, async (req, res) => {
  try {

    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user.id } }
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});
