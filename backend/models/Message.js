const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: { type: String, required: true },
  messageType: { type: String, enum: ["text", "image"], default: "text" },
}, { timestamps: true });
module.exports = mongoose.model("Message", MessageSchema);
