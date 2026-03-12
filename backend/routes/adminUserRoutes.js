const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const Admin = require("../models/Admin");

router.get("/", verifyToken, async (req, res) => {
  try {
    const { search = "" } = req.query;
    const q = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
      : {};
    const list = await Admin.find(q).select("-password").sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
 
router.patch("/:id/block", verifyToken, requireRole("super_admin", "moderator"), async (req, res) => {
  try {
    const { reason = "" } = req.body || {};
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true, blockReason: reason, blockedAt: new Date() },
      { new: true }
    ).select("-password");
    res.json(admin);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.patch("/:id/unblock", verifyToken, requireRole("super_admin", "moderator"), async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false, blockReason: "", blockedAt: null },
      { new: true }
    ).select("-password");
    res.json(admin);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.patch("/:id/role", verifyToken, requireRole("super_admin"), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!["super_admin", "moderator", "support"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    res.json(admin);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
