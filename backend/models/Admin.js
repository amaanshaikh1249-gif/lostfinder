const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["super_admin", "moderator", "support"], default: "support" },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String, default: "" },
  blockedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Admin", AdminSchema);
