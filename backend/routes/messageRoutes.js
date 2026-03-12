const express = require("express");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* SEND MESSAGE */
router.post("/", authMiddleware, async (req, res) => {
  try {

    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({
        message: "Invalid data passed"
      });
    }

    let newMessage = {
      sender: req.user.id,
      content: content,
      chat: chatId
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "username email");
    message = await message.populate("chat");
    message = await message.populate("chat.users", "username email");

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message
    });

    res.json(message);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});


/* GET ALL MESSAGES OF A CHAT */
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {

    const messages = await Message.find({
      chat: req.params.chatId
    })
      .populate("sender", "username email")
      .populate("chat");

    res.json(messages);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
