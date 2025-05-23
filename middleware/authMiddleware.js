// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未提供 Token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ JWT 驗證失敗:", error.message);
    return res.status(401).json({ message: "Token 已過期或無效" });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ message: "僅限管理者存取" });
  }
  next();
};

const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: '僅限超級管理員存取' });
  }
  next();
};

module.exports = { verifyToken, adminOnly, superadminOnly };
