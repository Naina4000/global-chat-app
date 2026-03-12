const express = require("express");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
SEND MESSAGE
*/
router.post("/", authMiddleware, async (req, res) => {
  try {

    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({
        message: "Invalid data"
      });
    }

    let newMessage = await Message.create({
      sender: req.user.id,
      content: content,
      chat: chatId
    });

    newMessage = await newMessage.populate("sender", "username email");
    newMessage = await newMessage.populate("chat");
    newMessage = await Message.populate(newMessage, {
      path: "chat.users",
      select: "username email"
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: newMessage
    });

    res.json(newMessage);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});


/*
FETCH ALL MESSAGES IN CHAT
*/
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
