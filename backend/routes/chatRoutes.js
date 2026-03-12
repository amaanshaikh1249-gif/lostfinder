const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { verifyUserToken } = require("../middleware/userAuth");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const LegacyMessage = require("../models/Message");
const Item = require("../models/Item");

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Search users
router.get("/users", verifyUserToken, async (req, res) => {
  try {
    const q = (req.query.search || "").trim();
    const query = q ? { $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] } : {};
    const list = await User.find(query).select("_id name email").limit(100);
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Find user by email (for resolving peer IDs from item reports)
router.get("/user/email/:email", verifyUserToken, async (req, res) => {
  try {
    const u = await User.findOne({ email: req.params.email }).select("_id name email");
    if (!u) return res.status(404).json({ msg: "User not found" });
    res.json(u);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Single user by id (for quick peer lookup)
router.get("/user/:id", verifyUserToken, async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("_id name email");
    if (!u) return res.status(404).json({ msg: "User not found" });
    res.json(u);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Conversations list
router.get("/conversations", verifyUserToken, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const me = new mongoose.Types.ObjectId(req.user.id);
    const conv = await ChatMessage.aggregate([
      { $match: { $or: [{ senderId: me }, { receiverId: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            peer: {
              $cond: [
                { $eq: ["$senderId", me] },
                "$receiverId",
                "$senderId"
              ]
            }
          },
          lastMessage: { $first: "$message" },
          lastType: { $first: "$messageType" },
          lastAt: { $first: "$createdAt" },
          itemId: { $max: "$itemId" }, // Get any itemId if present in the conversation
          unseenCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$receiverId", me] }, { $eq: ["$seen", false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { lastAt: -1 } } // Sort conversations by latest message
    ]);
    const peerIds = conv.map(c => c._id.peer);
    const itemIds = conv.map(c => c.itemId).filter(Boolean);
    
    const [peers, items] = await Promise.all([
      User.find({ _id: { $in: peerIds } }).select("_id name email"),
      Item.find({ _id: { $in: itemIds } }).select("_id name")
    ]);

    const peerMap = Object.fromEntries(peers.map(p => [String(p._id), p]));
    const itemMap = Object.fromEntries(items.map(i => [String(i._id), i]));

    const out = conv.map(c => {
      const p = peerMap[String(c._id.peer)];
      if (!p) return null;
      const item = itemMap[String(c.itemId)];
      return {
        peer: {
          ...p.toObject(),
          itemId: c.itemId || null,
          itemName: item?.name || null
        },
        lastMessage: c.lastMessage,
        lastType: c.lastType,
        lastAt: c.lastAt,
        unseenCount: c.unseenCount
      };
    }).filter(Boolean);
    res.json(out);
  } catch (e) {
    console.error("Conversations error:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get messages with peer
router.get("/messages/:peerId", verifyUserToken, async (req, res) => {
  try {
    const me = req.user.id;
    const peer = req.params.peerId;
    const list = await ChatMessage.find({
      $or: [
        { senderId: me, receiverId: peer },
        { senderId: peer, receiverId: me }
      ]
    }).sort({ createdAt: 1 });
    // Mark incoming as seen
    await ChatMessage.updateMany({ receiverId: me, senderId: peer, seen: false }, { seen: true });
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Send message (text)
router.post("/messages", verifyUserToken, async (req, res) => {
  try {
    const me = req.user.id;
    const { receiverId, message, itemId } = req.body || {};
    if (!receiverId || !message) return res.status(400).json({ msg: "Missing fields" });
    if (receiverId === me) return res.status(400).json({ msg: "Cannot message yourself" });
    const doc = await ChatMessage.create({ senderId: me, receiverId, message, messageType: "text", itemId: itemId || null });
    req.app.get("io").to(String(receiverId)).emit("chat:message", doc);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Send image
router.post("/messages/image", verifyUserToken, upload.single("file"), async (req, res) => {
  try {
    const me = req.user.id;
    const { receiverId, itemId } = req.body || {};
    if (!receiverId || !req.file) return res.status(400).json({ msg: "Missing fields" });
    const url = `/uploads/${req.file.filename}`;
    const doc = await ChatMessage.create({ senderId: me, receiverId, message: url, messageType: "image", itemId: itemId || null });
    req.app.get("io").to(String(receiverId)).emit("chat:message", doc);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

const legacy = express.Router();
legacy.get("/conversations", verifyUserToken, async (req, res) => {
  try {
    const me = req.query.email || req.user.email;
    const list = await LegacyMessage.find({ $or: [{ from: me }, { to: me }] }).sort({ createdAt: -1 }).limit(500);
    const groups = new Map();
    for (const m of list) {
      const peer = m.from === me ? m.to : m.from;
      const key = `${peer}:${m.itemId}`;
      if (!groups.has(key)) {
        groups.set(key, { peerEmail: peer, itemId: m.itemId, lastMessage: m.text, lastType: "text", lastAt: m.createdAt, unseenCount: 0 });
      }
    }
    const itemIds = [...new Set([...groups.values()].map(g => g.itemId).filter(Boolean))];
    const items = await Item.find({ _id: { $in: itemIds } }).select("_id name contact status");
    const itemMap = Object.fromEntries(items.map(i => [String(i._id), { name: i.name, contact: i.contact, status: i.status }]));
    const out = [...groups.values()].map(g => ({ ...g, itemName: itemMap[String(g.itemId)]?.name || "Unknown", contact: itemMap[String(g.itemId)]?.contact || "" }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
legacy.get("/messages", verifyUserToken, async (req, res) => {
  try {
    const me = req.query.email || req.user.email;
    const peer = req.query.peerEmail;
    if (!peer) return res.status(400).json({ msg: "Missing peerEmail" });
    const list = await LegacyMessage.find({
      $or: [
        { from: me, to: peer },
        { from: peer, to: me }
      ]
    }).sort({ createdAt: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
module.exports.legacy = legacy;
