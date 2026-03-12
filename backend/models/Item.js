const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  contact: {
    type: String
  },

  email: {
    type: String
  },

  // ⭐ IMAGE FIELD (ONLY ONCE)
  image: {
    type: String
  },

  status: {
    type: String,
    enum: ["Lost", "Found", "Returned"],
    required: true
  },

  // ⭐ CLAIM SYSTEM
  claimedBy: {
    type: String,
    default: null
  },

  claimStatus: {
    type: String,
    enum: ["None", "Pending", "Approved", "Rejected"],
    default: "None"
  },
  claimProofs: {
    type: [String],
    default: []
  },
  claimDecisionReason: {
    type: String,
    default: ""
  },
  aiConfidence: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Item", ItemSchema);
