// controllers/voteController.js
const db = require("../config/db");

const createVote = async (req, res) => {
  try {
    const { title, description, start_time, end_time, is_anonymous, target_group } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ message: "請提供投票標題、開始與結束時間" });
    }
    await db.query(
      "INSERT INTO votes (title, description, start_time, end_time, is_anonymous, target_group) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description || "", start_time, end_time, is_anonymous, target_group || "ALL"]
    );
    res.status(201).json({ message: "投票建立成功" });
  } catch (error) {
    console.error("❌ 建立投票失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

const registerAttendance = async (req, res) => {
  try {
    const voteId = req.params.voteId;
    const userId = req.user.id;
    await db.query(
      "INSERT INTO attendance (vote_id, user_id, attendance_time, has_voted) VALUES (?, ?, NOW(), false) ON DUPLICATE KEY UPDATE attendance_time = NOW()",
      [voteId, userId]
    );
    res.status(201).json({ message: "出席登記成功" });
  } catch (error) {
    console.error("❌ 出席登記失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

const castVote = async (req, res) => {
  try {
    const voteId = req.params.voteId;
    const userId = req.user.id;
    const { vote_choice } = req.body;
    if (!vote_choice || !["approve", "reject", "abstain"].includes(vote_choice)) {
      return res.status(400).json({ message: "無效的投票選項" });
    }
    // 取得投票的目標群組
    const [voteData] = await db.query("SELECT target_group FROM votes WHERE id = ?", [voteId]);
    if (voteData.length === 0) {
      return res.status(404).json({ message: "找不到該投票" });
    }
    const targetGroup = voteData[0].target_group;

    // 如果投票目標不是 ALL 與 院會，則檢查用戶是否屬於該特定群組（黨團或委員會必須符合）
    if (targetGroup !== "ALL" && targetGroup !== "院會") {
      const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
      if (!user.length || (user[0].party !== targetGroup && user[0].committee !== targetGroup)) {
        return res.status(403).json({ message: "你不在這個投票群組內" });
      }
    }
    // 如果投票目標是 院會，則檢查用戶是否有黨團資料（非空即可）
    if (targetGroup === "院會") {
      const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
      if (!user.length || !user[0].party) {
        return res.status(403).json({ message: "院會投票僅限具有黨團資料的用戶參與" });
      }
    }
    
    // 檢查是否已投票
    const [existingVote] = await db.query("SELECT * FROM vote_records WHERE vote_id = ? AND user_id = ?", [voteId, userId]);
    if (existingVote.length > 0) {
      return res.status(400).json({ message: "你已經投過票了" });
    }
    
    await db.query(
      "INSERT INTO vote_records (vote_id, user_id, vote_choice, vote_time) VALUES (?, ?, ?, NOW())",
      [voteId, userId, vote_choice]
    );
    await db.query(
      "UPDATE attendance SET has_voted = true WHERE vote_id = ? AND user_id = ?",
      [voteId, userId]
    );
    res.status(201).json({ message: "投票成功" });
  } catch (error) {
    console.error("❌ 投票失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// controllers/voteController.js - getVoteResults 更新後的版本
const getVoteResults = async (req, res) => {
  try {
    const voteId = req.params.voteId;
    const [voteRows] = await db.query("SELECT * FROM votes WHERE id = ?", [voteId]);
    if (voteRows.length === 0) {
      return res.status(404).json({ message: "找不到該投票" });
    }
    const vote = voteRows[0];
    const targetGroup = vote.target_group || "ALL";
    const is_anonymous = vote.is_anonymous;  // 取得匿名狀態

    let totalVotersQuery, totalVotersParams;
    if (targetGroup === "ALL") {
      totalVotersQuery = "SELECT COUNT(*) AS total FROM users";
      totalVotersParams = [];
    } else if (targetGroup === "院會") {
      totalVotersQuery = "SELECT COUNT(*) AS total FROM users WHERE party <> ''";
      totalVotersParams = [];
    } else {
      totalVotersQuery = "SELECT COUNT(*) AS total FROM users WHERE party = ? OR committee = ?";
      totalVotersParams = [targetGroup, targetGroup];
    }
    const [totalVotersData] = await db.query(totalVotersQuery, totalVotersParams);
    const totalVoters = totalVotersData[0]?.total || 0;

    const [presentData] = await db.query(
      "SELECT COUNT(DISTINCT user_id) AS present FROM attendance WHERE vote_id = ?",
      [voteId]
    );
    const totalPresent = presentData[0]?.present || 0;

    const [voteResults] = await db.query(
      `SELECT 
          SUM(CASE WHEN vote_choice = 'approve' THEN 1 ELSE 0 END) AS approve,
          SUM(CASE WHEN vote_choice = 'reject' THEN 1 ELSE 0 END) AS reject,
          SUM(CASE WHEN vote_choice = 'abstain' THEN 1 ELSE 0 END) AS abstain
        FROM vote_records
        WHERE vote_id = ?`,
      [voteId]
    );
    const attendanceRate = totalVoters > 0 ? (totalPresent / totalVoters) * 100 : 0;
    res.json({ 
      title: vote.title,
      description: vote.description,
      created_at: vote.created_at,
      end_time: vote.end_time,
      targetGroup, 
      totalVoters, 
      totalPresent, 
      attendanceRate: attendanceRate.toFixed(2),
      approve: voteResults[0]?.approve || 0,
      reject: voteResults[0]?.reject || 0,
      abstain: voteResults[0]?.abstain || 0,
      is_anonymous  
    });
  } catch (error) {
    console.error("❌ 取得投票結果錯誤:", error);
    res.status(500).json({ message: "無法取得投票結果" });
  }
};

const getActiveVotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const userParty = req.user.party || "";
    const userCommittee = req.user.committee || "";
    const [rows] = await db.query(
      `SELECT v.*, 
              IF(a.user_id IS NULL, 0, 1) AS attended, 
              vr.vote_choice AS user_vote
       FROM votes v
       LEFT JOIN attendance a ON v.id = a.vote_id AND a.user_id = ?
       LEFT JOIN vote_records vr ON v.id = vr.vote_id AND vr.user_id = ?
       WHERE NOW() < v.end_time 
         AND (
           v.target_group = 'ALL'
           OR (v.target_group = '院會' AND ? <> '')
           OR v.target_group = ?
           OR v.target_group = ?
         )`,
      [userId, userId, userParty, userParty, userCommittee]
    );
    res.json({ votes: rows });
  } catch (error) {
    console.error("取得開放投票失敗:", error);
    res.status(500).json({ message: "取得開放投票失敗" });
  }
};

const getVoteRecords = async (req, res) => {
  try {
    const voteId = req.params.voteId;
    // 先查詢該投票是否為匿名投票
    const [voteRows] = await db.query("SELECT is_anonymous FROM votes WHERE id = ?", [voteId]);
    if (voteRows.length === 0) {
      return res.status(404).json({ message: "找不到該投票" });
    }
    if (Number(voteRows[0].is_anonymous)) {
       //如果是匿名投票，則不允許取得記錄
      return res.status(403).json({ message: "匿名投票不能顯示個別投票記錄" });
    }
    
    // 若非匿名，則取得投票記錄
    const [rows] = await db.query(
      `SELECT vr.id, u.username, u.chinese_name, u.party, u.committee, vr.vote_choice
       FROM vote_records vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.vote_id = ?`,
      [voteId]
    );
    res.json({ records: rows });
  } catch (error) {
    console.error("取得投票記錄失敗:", error);
    res.status(500).json({ message: "取得投票記錄失敗" });
  }
};


const deleteVote = async (req, res) => {
  try {
    const voteId = req.params.voteId;
    const [result] = await db.query("DELETE FROM votes WHERE id = ?", [voteId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "找不到該投票" });
    }
    res.json({ message: "投票已刪除" });
  } catch (error) {
    console.error("刪除投票失敗:", error);
    res.status(500).json({ message: "刪除投票失敗" });
  }
};

const autoAbstainVotes = async () => {
  try {
    // 取得所有已結束投票中尚未投票的出席記錄
    const [rows] = await db.query(`
      SELECT a.vote_id, a.user_id
      FROM attendance a
      JOIN votes v ON a.vote_id = v.id
      WHERE v.end_time < NOW() AND a.has_voted = false
    `);
    
    for (const record of rows) {
      // 檢查該使用者是否已存在 vote_records 記錄（理論上應該不存在）
      const [existing] = await db.query(
        "SELECT id FROM vote_records WHERE vote_id = ? AND user_id = ?",
        [record.vote_id, record.user_id]
      );
      if (existing.length === 0) {
        // 將未投票者的記錄登記為棄權
        await db.query(
          "INSERT INTO vote_records (vote_id, user_id, vote_choice, vote_time) VALUES (?, ?, 'abstain', NOW())",
          [record.vote_id, record.user_id]
        );
      }
      // 更新 attendance 記錄為已投票
      await db.query(
        "UPDATE attendance SET has_voted = true WHERE vote_id = ? AND user_id = ?",
        [record.vote_id, record.user_id]
      );
    }
    console.log(`Auto-registered abstain votes for ${rows.length} records.`);
  } catch (error) {
    console.error("Auto abstain vote error:", error);
  }
};

module.exports = {
  createVote,
  registerAttendance,
  castVote,
  getVoteResults,
  getActiveVotes,
  getVoteRecords,
  deleteVote,
  autoAbstainVotes,
};
