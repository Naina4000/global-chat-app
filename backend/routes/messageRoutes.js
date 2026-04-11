const express = require("express");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*SEND MESSAGE*/

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
  chat: chatId,
  status: "sent"
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


/*FETCH ALL MESSAGES IN CHAT*/
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

/*EDIT MESSAGE*/

router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // only sender can edit
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    message.content = content;

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate("chat");

    res.json(updatedMessage);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


/*DELETE MESSAGE*/

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 🔥 IMPORTANT: DO NOT DELETE FROM DB
    message.content = "";
    message.deleted = true;

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate("chat");

    res.json(updatedMessage);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
