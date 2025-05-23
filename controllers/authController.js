// controllers/authController.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: "用戶不存在" });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "密碼錯誤" });
    }
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        chinese_name: user.chinese_name,
        role: user.role,
        party: user.party,
        committee: user.committee
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error("登入失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};
