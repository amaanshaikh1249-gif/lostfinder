const mongoose = require("mongoose");
const ChatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
  message: { type: String, default: "" },
  messageType: { type: String, enum: ["text", "image"], default: "text" },
  seen: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
