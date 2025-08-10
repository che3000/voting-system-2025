// controllers/adminController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 將上傳暫存至 uploads 資料夾


const createUser = async (req, res) => {
  try {
    const { username, chinese_name, password, party, committee, role } = req.body;
    if (!username || !password || !role || !chinese_name) {
      return res.status(400).json({ message: '請提供必要資料：username, password, chinese_name 與 role' });
    }
    
    let newParty = party;
    let newCommittee = committee;
    // 如果角色為管理員(admin)、國會媒體(press) 或 超級管理員(superadmin)，黨團與委員會設為 NULL
    if (role === "管理員" || role === "國會媒體" || role === "超級管理員") {
      newParty = null;
      newCommittee = null;
    }
    
    // 角色對照：前端中文 -> 後端英文
    const roleMapping = {
      "一般委員": "user",
      "國會媒體": "press",
      "管理員": "admin",
      "超級管理員": "superadmin"
    };
    const backendRole = roleMapping[role] || role;
    
    const password_hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, chinese_name, password_hash, party, committee, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, chinese_name, password_hash, newParty, newCommittee, backendRole]
    );
    res.status(201).json({ message: '用戶新增成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

const getUsers = async (req, res) => {
  try {
    // 包含 chinese_name 欄位
    const [rows] = await db.query(
      "SELECT id, username, chinese_name, party, committee, role FROM users"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error("取得用戶列表時發生錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.query(
      'SELECT id, username, chinese_name, party, committee, role FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '用戶不存在' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // 刪除相關記錄以避免外鍵衝突
    await db.query('DELETE FROM vote_records WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM attendance WHERE user_id = ?', [userId]);
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '找不到該用戶' });
    }
    res.json({ message: '用戶刪除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

const checkSuperAdminExists = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'");
    res.json({ exists: rows[0].count > 0 });
  } catch (error) {
    console.error("Error checking super admin:", error);
    res.status(500).json({ message: "檢查超級管理員失敗" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, chinese_name, password, party, committee, role } = req.body;

    // 先取得目標用戶目前的角色
    const [targetRows] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (targetRows.length === 0) {
      return res.status(404).json({ message: "找不到該用戶" });
    }
    const targetUserRole = targetRows[0].role;
    
    // 權限檢查：
    // 超級管理員可以變更所有人的資訊，
    // 如果登入用戶不是 superadmin，則不允許修改目標用戶為 admin 或 superadmin，也不允許修改原本已是 admin 或 superadmin 的用戶
    if (req.user.role !== "superadmin") {
      if (targetUserRole === "admin" || targetUserRole === "superadmin") {
        return res.status(403).json({ message: "您沒有權限變更此用戶的資訊" });
      }
      if (role === "admin" || role === "superadmin") {
        return res.status(403).json({ message: "您沒有權限將用戶角色設為管理員或超級管理員" });
      }
    }
    
    let updateFields = [];
    let values = [];
    
    if (username) {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (chinese_name) {
      updateFields.push('chinese_name = ?');
      values.push(chinese_name);
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      values.push(password_hash);
    }
    if (role) {
      updateFields.push('role = ?');
      values.push(role);
      if (role === "admin" || role === "press" || role === "superadmin") {
        updateFields.push('party = NULL');
        updateFields.push('committee = NULL');
      } else {
        if (party !== undefined) {
          updateFields.push('party = ?');
          values.push(party);
        }
        if (committee !== undefined) {
          updateFields.push('committee = ?');
          values.push(committee);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '沒有要更新的資料' });
    }
    
    values.push(userId);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '找不到該用戶' });
    }
    res.json({ message: '用戶更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

const setupSuperAdmin = async (req, res) => {
  try {
    // 防止重複建立
    const [rows] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'");
    if (rows[0].count > 0) {
      return res.status(400).json({ message: "超級管理員已存在" });
    }
    const { username, chinese_name, password } = req.body;
    if (!username || !password || !chinese_name) {
      return res.status(400).json({ message: "請提供所有必要資料" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, chinese_name, password_hash, role) VALUES (?, ?, ?, 'superadmin')",
      [username, chinese_name, password_hash]
    );
    res.status(201).json({ message: "超級管理員建立成功" });
  } catch (error) {
    console.error("Error in setupSuperAdmin:", error);
    res.status(500).json({ message: "設定超級管理員失敗" });
  }
};

const uploadUsersCSV = (req, res) => {
  // 使用 multer 處理單一檔案上傳
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(500).json({ message: '檔案上傳失敗' });
    }
    if (!req.file) {
      return res.status(400).json({ message: '未上傳檔案' });
    }
    const results = [];
    const fs = require('fs');
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        // 刪除暫存檔案
        fs.unlinkSync(req.file.path);
        try {
          for (const row of results) {
            // 假設 CSV 欄位：role, username, chinese_name, password, party, committee
            const { role, username, chinese_name, password, party, committee } = row;
            const roleMapping = {
              "一般委員": "user",
              "國會媒體": "press",
              "管理員": "admin",
              "超級管理員": "superadmin"
            };
            const backendRole = roleMapping[role] || 'user';
            const newParty = backendRole === 'user' ? party : null;
            const newCommittee = backendRole === 'user' ? committee : null;
            const password_hash = await bcrypt.hash(password, 10);
            await db.query(
              'INSERT INTO users (username, chinese_name, password_hash, party, committee, role) VALUES (?, ?, ?, ?, ?, ?)',
              [username, chinese_name, password_hash, newParty, newCommittee, backendRole]
            );
          }
          res.status(201).json({ message: 'CSV 上傳成功，帳戶已建立' });
        } catch (error) {
          console.error('CSV 解析或新增帳戶錯誤：', error);
          res.status(500).json({ message: '批次建立用戶失敗' });
        }
      });
  });
};
console.log("adminController uploadUsersCSV:", uploadUsersCSV);
module.exports = {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  checkSuperAdminExists,
  setupSuperAdmin,
  uploadUsersCSV
};
