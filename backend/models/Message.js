const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  content: {
    type: String,
    trim: true
  },

  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat"
  },

  deleted: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
  }

},
{
  timestamps: true
}
);

module.exports = mongoose.model("Message", messageSchema);
