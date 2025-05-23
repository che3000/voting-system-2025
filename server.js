const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require('node-cron');
const app = express();

app.use(express.json());
app.use(cors());

// 載入認證路由
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// 掛載超級管理員相關路由，不受驗證保護
app.use("/api/superadmin", require("./routes/superadmin"));

// JWT 驗證與管理員權限保護後的管理員路由
const { verifyToken, adminOnly } = require("./middleware/authMiddleware");
app.use("/api/admin", verifyToken, adminOnly, require("./routes/admin"));

// 投票相關路由（需要登入）
app.use("/api/votes", verifyToken, require("./routes/votes"));

// 測試根路由
app.get("/", (req, res) => {
  res.send("Voting System API is running");
});

// 取得當前登入使用者資訊
app.get("/api/auth/me", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
  });
});

const { autoAbstainVotes } = require('./controllers/voteController');
cron.schedule('*/20 * * * * *', () => {
  console.log("Running auto abstain votes task...");
  autoAbstainVotes();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});