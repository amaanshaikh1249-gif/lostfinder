const express = require("express");
const router = express.Router();
const multer = require("multer");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const nodemailer = require("nodemailer");
const { verifyToken, requireRole } = require("../middleware/auth");

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

function similarity(a = "", b = "") {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const inter = [...ta].filter(x => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size || 1;
  return inter / union;
}

function buildTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}



/* =========================
   ADD ITEM WITH IMAGE
========================= */

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await newItem.save();

    const oppositeStatus = newItem.status === "Lost" ? "Found" : "Lost";
  const candidates = await Item.find({ status: oppositeStatus });
    const matches = candidates
      .map(i => {
      const score =
        0.4 * similarity(newItem.name, i.name) +
        0.25 * similarity(newItem.category, i.category) +
        0.2 * similarity(newItem.location, i.location) +
        0.15 * similarity(newItem.description || "", i.description || "") +
        (req.file?.originalname ? 0.05 * similarity(req.file.originalname, i.image || "") : 0);
        return { item: i, score };
      })
      .filter(x => x.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    let alerts = [];
    const transporter = buildTransporter();
    for (const m of matches) {
      const recipient = newItem.status === "Found" ? m.item.email : newItem.email;
      if (!recipient) continue;
      const subject =
        newItem.status === "Found"
          ? `Possible match for your lost item: ${m.item.name}`
          : `Possible finder reported: ${newItem.name}`;
      const text =
        `We detected a possible match.\n` +
        `Item: ${newItem.status === "Found" ? m.item.name : newItem.name}\n` +
        `Location: ${newItem.status === "Found" ? m.item.location : newItem.location}\n` +
        `Category: ${newItem.status === "Found" ? m.item.category : newItem.category}\n` +
        `Score: ${(m.score * 100).toFixed(0)}%\n` +
        `Contact: ${newItem.status === "Found" ? newItem.contact : m.item.contact || "N/A"}`;
      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || "no-reply@lostfinder.local",
            to: recipient,
            subject,
            text,
          });
          alerts.push({ to: recipient, ok: true });
        } catch (e) {
          alerts.push({ to: recipient, ok: false });
        }
      } else {
        alerts.push({ to: recipient, ok: true });
        console.log("[EmailSimulated]", recipient, subject);
      }
      await Notification.create({
        email: recipient,
        title: "Possible Match Detected",
        body: `Item: ${newItem.status === "Found" ? m.item.name : newItem.name} • ${(m.score * 100).toFixed(0)}%`
      });
    }

    res.json({ message: "Item added with image", matches: matches.map(m => ({ id: m.item._id, score: m.score })), alerts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET ITEMS
========================= */

router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    const withImages = items.map(i => {
      const obj = i.toObject();
      const img = obj.image;
      const valid =
        typeof img === "string" &&
        (
          img.startsWith("/uploads/") ||
          img.startsWith("/images/") ||
          /^https?:\/\//.test(img)
        );
      obj.image = valid ? img : "/images/item-placeholder.svg";
      return obj;
    });
    res.json(withImages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET SINGLE ITEM SUMMARY
router.get("/summary/:id", async (req, res) => {
  try {
    const i = await Item.findById(req.params.id);
    if (!i) return res.status(404).json({ message: "Not found" });
    const obj = i.toObject();
    res.json({
      _id: obj._id,
      name: obj.name,
      category: obj.category,
      location: obj.location,
      contact: obj.contact,
      email: obj.email,
      status: obj.status
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DELETE ITEM
========================= */

router.delete("/delete/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete error" });
  }
});

// CLAIM ITEM
router.post("/claim/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ msg: "Item not found" });

    item.claimedBy = req.body.email;
    item.claimStatus = "Pending";
    item.claimProofs = Array.isArray(req.body.proofs) ? req.body.proofs : item.claimProofs;

    // Compute AI confidence vs best opposite match for review context
    const opposite = item.status === "Lost" ? "Found" : "Lost";
    const candidates = await Item.find({ status: opposite });
    let best = 0;
    for (const c of candidates) {
      const score =
        0.4 * similarity(item.name, c.name) +
        0.25 * similarity(item.category, c.category) +
        0.2 * similarity(item.location, c.location) +
        0.15 * similarity(item.description || "", c.description || "");
      if (score > best) best = score;
    }
    item.aiConfidence = Math.round(best * 100);

    await item.save();

    if (item.email) {
      await Notification.create({
        email: item.email,
        title: "New Claim Request",
        body: `Claimed by ${req.body.email} for ${item.name}`
      });
    }

    res.json({ msg: "Claim request sent", aiConfidence: item.aiConfidence });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE CLAIM STATUS (ADMIN)
router.put("/claim-status/:id", verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    item.claimStatus = req.body.status;
    item.claimDecisionReason = req.body.reason || "";
    if (req.body.status === "Approved") {
      item.status = "Returned";
    }

    await item.save();

    if (item.claimedBy) {
      await Notification.create({
        email: item.claimedBy,
        title: `Claim ${req.body.status}`,
        body: `${item.name} claim is ${req.body.status}`
      });
    }
    if (item.email) {
      await Notification.create({
        email: item.email,
        title: `Claim ${req.body.status}`,
        body: `${item.name} claim is ${req.body.status}`
      });
    }

    res.json({ msg: "Claim status updated" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// ADMIN: LIST PENDING CLAIMS
router.get("/admin/claims", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const pending = await Item.find({ claimStatus: "Pending" }).sort({ updatedAt: -1 }).limit(200);
    res.json(pending);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
// ADMIN: CLAIM DETAIL WITH MATCH + PROOFS
router.get("/admin/claims/:id", verifyToken, requireRole("super_admin", "moderator", "support"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });
    const opposite = item.status === "Lost" ? "Found" : "Lost";
    const candidates = await Item.find({ status: opposite });
    const ranked = candidates
      .map(i => {
        const score =
          0.4 * similarity(item.name, i.name) +
          0.25 * similarity(item.category, i.category) +
          0.2 * similarity(item.location, i.location) +
          0.15 * similarity(item.description || "", i.description || "");
        return { i, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]?.i || null;
    const conf = Math.round((ranked[0]?.score || 0) * 100);
    res.json({
      item,
      counterpart: best,
      aiConfidence: conf,
      proofs: item.claimProofs || []
    });
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
});
// UPDATE ITEM LOST/FOUND STATUS (ADMIN)
router.put("/status/:id", verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });
    item.status = req.body.status;
    await item.save();
    res.json({ msg: "Item status updated" });
  } catch (err) {
    console.error("Status update error:", err?.message || err);
    res.status(500).json({ msg: "Server error" });
  }
});
// NOTIFICATIONS
router.get("/notifications/:email", async (req, res) => {
  try {
    const list = await Notification.find({ email: req.params.email }).sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.put("/notifications/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// MESSAGES
router.post("/message/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });
    const { from, to, text } = req.body;
    if (!from || !to || !text) return res.status(400).json({ msg: "Missing fields" });
    const msg = await Message.create({ itemId: item._id, from, to, text });
    if (to) {
      await Notification.create({
        email: to,
        title: "New Message",
        body: `From ${from} about ${item.name}`
      });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/message/image/:id", upload.single("file"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });
    const { from, to } = req.body;
    if (!from || !to || !req.file) return res.status(400).json({ msg: "Missing fields" });
    const url = `/uploads/${req.file.filename}`;
    const msg = await Message.create({ itemId: item._id, from, to, text: url, messageType: "image" });
    if (to) {
      await Notification.create({
        email: to,
        title: "New Image Message",
        body: `From ${from} about ${item.name}`
      });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/message/:id", async (req, res) => {
  try {
    const list = await Message.find({ itemId: req.params.id }).sort({ createdAt: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// GET SINGLE ITEM SUMMARY
router.get("/summary/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select("name category location status description image createdAt contact email claimedBy");
    if (!item) return res.status(404).json({ msg: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET USER DASHBOARD DATA
router.get("/user/:email", async (req, res) => {
  try {

    const userEmail = req.params.email;

    const myReports = await Item.find({ email: userEmail });
    const myClaims = await Item.find({ claimedBy: userEmail });

    res.json({
      reports: myReports,
      claims: myClaims
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
