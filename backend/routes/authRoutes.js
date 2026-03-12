const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { verifyToken } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "lostfound_secret_key";

/* =========================
   REGISTER ADMIN
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await Admin.findOne({ email });
    if (exist) return res.status(400).json({ msg: "Admin already exists" });

    const hash = await bcrypt.hash(password, 10);

    const isFirst = (await Admin.countDocuments()) === 0;
    const admin = new Admin({
      name,
      email,
      password: hash,
      role: isFirst ? "super_admin" : undefined
    });

    await admin.save();

    res.json({ msg: "Admin registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/self-elevate", verifyToken, async (req, res) => {
  try {
    const superCount = await Admin.countDocuments({ role: "super_admin" });
    if (superCount > 0) return res.status(409).json({ msg: "super_admin already exists" });
    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { role: "super_admin" },
      { new: true }
    ).select("-password");
    if (!admin) return res.status(404).json({ msg: "Admin not found" });
    res.json({ ok: true, admin });
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});


/* =========================
   LOGIN ADMIN (JWT)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Invalid email" });

    if (admin.isBlocked) {
      return res.status(403).json({ msg: "Account suspended. Contact admin." });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isBlocked: admin.isBlocked
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


/* =========================
   VERIFY TOKEN ROUTE
========================= */
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, admin: decoded });

  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
