const mongoose = require("mongoose");
const NotificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  read: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model("Notification", NotificationSchema);
