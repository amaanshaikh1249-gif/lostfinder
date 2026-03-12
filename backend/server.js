require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set("io", io);

/* =========================
   MIDDLEWARE
========================= */
const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

/* =========================
   IMAGE STATIC FOLDER
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ROUTES
========================= */
app.use("/api/item", require("./routes/itemRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin/users", require("./routes/adminUserRoutes"));
app.use("/api/admin/analytics", require("./routes/analyticsRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);
app.use("/api/chat/legacy", chatRoutes.legacy);

/* =========================
   PRODUCTION STATIC SERVING
========================= */
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.resolve(clientPath, "index.html"));
    }
  });
}

/* =========================
   DATABASE
========================= */
if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  });

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* =========================
   SOCKET.IO
========================= */
io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(String(userId));
    socket.data.userId = String(userId);
    io.emit("presence:online", { userId });
  }
  socket.on("typing", ({ to }) => {
    if (to) io.to(String(to)).emit("typing", { from: socket.data.userId });
  });
  socket.on("disconnect", () => {
    if (socket.data.userId) {
      io.emit("presence:offline", { userId: socket.data.userId });
    }
  });
});
