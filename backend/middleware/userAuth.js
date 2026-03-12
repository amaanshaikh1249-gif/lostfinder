const jwt = require("jsonwebtoken");

function verifyUserToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ msg: "No token" });
    const secret = process.env.JWT_SECRET || "lostfound_secret_key";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

module.exports = { verifyUserToken };
