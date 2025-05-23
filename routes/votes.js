// routes/votes.js
const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { adminOnly, verifyToken } = require('../middleware/authMiddleware');

// 建立投票：僅限管理者（請確保只留一個建立投票的路由）
router.post('/', adminOnly, voteController.createVote);

// 用戶出席登記
router.post('/:voteId/attendance', verifyToken, voteController.registerAttendance);

// 用戶投票
router.post('/:voteId/cast', verifyToken, voteController.castVote);

// 查詢投票結果
router.get('/:voteId/results', verifyToken, voteController.getVoteResults);

// 其他查詢 API 範例：
router.get('/count', verifyToken, async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.query("SELECT COUNT(*) AS totalVotes FROM votes");
    res.json({ totalVotes: rows[0].totalVotes });
  } catch (error) {
    console.error("取得投票數據錯誤:", error);
    res.status(500).json({ message: "無法取得投票數據" });
  }
});

router.get('/active', verifyToken, voteController.getActiveVotes);

router.get('/history', verifyToken, async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.query("SELECT id, title, created_at FROM votes ORDER BY created_at DESC");
    res.json({ votes: rows });
  } catch (error) {
    console.error("取得歷史投票資料錯誤:", error);
    res.status(500).json({ message: "無法取得歷史投票資料" });
  }
});

// 取得指定投票資訊
router.get("/:id", verifyToken, async (req, res) => {
  const voteId = req.params.id;
  try {
    const db = require("../config/db");
    const [rows] = await db.query("SELECT * FROM votes WHERE id = ?", [voteId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "找不到該投票" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("取得投票資料錯誤:", error);
    res.status(500).json({ message: "無法取得投票資料" });
  }
});

router.get('/active', verifyToken, async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.query("SELECT id, title, end_time FROM votes WHERE NOW() < end_time ORDER BY end_time ASC");
    res.json({ votes: rows });
  } catch (error) {
    console.error("取得進行中投票失敗:", error);
    res.status(500).json({ message: "無法取得進行中的投票" });
  }
});
router.delete('/:voteId', verifyToken, adminOnly, voteController.deleteVote);

router.get('/:voteId/records', verifyToken, voteController.getVoteRecords);

module.exports = router;
