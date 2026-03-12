const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Item = require("../models/Item");
const Admin = require("../models/Admin");

function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ msg: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "lostfound_secret_key");
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) return res.status(403).json({ msg: "Forbidden" });
    next();
  };
}

router.get("/summary", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const [users, lost, found, returned] = await Promise.all([
      Admin.countDocuments(),
      Item.countDocuments({ status: "Lost" }),
      Item.countDocuments({ status: "Found" }),
      Item.countDocuments({ status: "Returned" }),
    ]);
    const total = lost + found + returned || 1;
    const recoveryRate = Math.round((returned / total) * 100);
    res.json({ users, lost, found, returned, recoveryRate });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/monthly", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const data = await Item.aggregate([
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, s: "$status" },
          c: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { y: "$_id.y", m: "$_id.m" },
          lost: { $sum: { $cond: [{ $eq: ["$_id.s", "Lost"] }, "$c", 0] } },
          found: { $sum: { $cond: [{ $eq: ["$_id.s", "Found"] }, "$c", 0] } },
          returned: { $sum: { $cond: [{ $eq: ["$_id.s", "Returned"] }, "$c", 0] } },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
      {
        $project: {
          _id: 0,
          y: "$_id.y",
          m: "$_id.m",
          lost: 1,
          found: 1,
          returned: 1,
        },
      },
    ]);
    res.json(data);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/top-category", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const data = await Item.aggregate([
      { $group: { _id: "$category", c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, category: "$_id", count: "$c" } },
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/top-location", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const data = await Item.aggregate([
      { $group: { _id: "$location", c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, location: "$_id", count: "$c" } },
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

