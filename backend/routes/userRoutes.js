const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyToken, requireRole } = require("../middleware/auth");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ msg: "Missing fields" });
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "User already exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email" });
    if (user.isBlocked) return res.status(403).json({ msg: "Account suspended" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid password" });
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, type: "user" },
      process.env.JWT_SECRET || "lostfound_secret_key",
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const { search = "" } = req.query || {};
    const q = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const list = await User.find(q).select("-password").sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.patch("/:id/block", verifyToken, requireRole("super_admin", "moderator"), async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { isBlocked: true, blockedAt: new Date() }, { new: true }).select("-password");
    res.json(u);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.patch("/:id/unblock", verifyToken, requireRole("super_admin", "moderator"), async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { isBlocked: false, blockedAt: null }, { new: true }).select("-password");
    res.json(u);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
