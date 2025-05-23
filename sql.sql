-- 建立 users 表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  chinese_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  party VARCHAR(50),
  committee VARCHAR(50),
  role ENUM('user', 'press', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立 votes 表
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
  target_group VARCHAR(50) NOT NULL DEFAULT 'ALL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立 attendance 表
CREATE TABLE IF NOT EXISTS attendance (
  vote_id INT NOT NULL,
  user_id INT NOT NULL,
  attendance_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  has_voted TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (vote_id, user_id),
  FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 建立 vote_records 表
CREATE TABLE IF NOT EXISTS vote_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vote_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_choice ENUM('approve', 'reject', 'abstain') NOT NULL,
  vote_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote_user (vote_id, user_id),
  FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);