// src/AddUser.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from './axiosConfig';

const AddUser = () => {
  const [formData, setFormData] = useState({
    role: '',
    username: '',     // 使用者ID
    chinese_name: '', // 中文姓名
    password: '',
    party: '',
    committee: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // 取得目前登入使用者角色（英文）
  const [currentUserRole, setCurrentUserRole] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserRole(decoded.role); // 例如："admin" 或 "superadmin"
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
  }, []);
  
  // 定義允許建立的角色選項
  // 超級管理員可以建立所有角色；其他人僅能建立「一般委員」與「國會媒體」
  const allowedRoles =
    currentUserRole === 'superadmin'
      ? ["一般委員", "國會媒體", "管理員", "超級管理員"]
      : ["一般委員", "國會媒體"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // 當角色改變為「國會媒體」、「管理員」或「超級管理員」時，清空 party 與 committee
    if (name === 'role' && (value === '國會媒體' || value === '管理員' || value === '超級管理員')) {
      setFormData({
        ...formData,
        role: value,
        party: '',
        committee: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // 直接送出 formData，後端會進行英文轉換
      await axios.post('/api/admin/users', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('用戶新增成功');
      navigate('/admin/users');
    } catch (err) {
      console.error(err);
      setError('用戶新增失敗');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ maxWidth: 500, mx: 'auto', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            新增用戶
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            {/* 角色下拉選單：只顯示允許的角色 */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">角色</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleChange}
              >
                {allowedRoles.map((roleOption) => (
                  <MenuItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 使用者ID欄位 */}
            <TextField
              label="使用者ID"
              name="username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleChange}
              required
            />

            {/* 中文姓名欄位 */}
            <TextField
              label="中文姓名"
              name="chinese_name"
              fullWidth
              margin="normal"
              value={formData.chinese_name}
              onChange={handleChange}
              required
            />

            <TextField
              label="密碼"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {/* 當角色為一般委員時，顯示黨團與委員會選單 */}
            {formData.role === '一般委員' && (
              <>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="party-label">黨團</InputLabel>
                  <Select
                    labelId="party-label"
                    name="party"
                    value={formData.party}
                    label="黨團"
                    onChange={handleChange}
                  >
                    <MenuItem value="A黨團">A黨團</MenuItem>
                    <MenuItem value="B黨團">B黨團</MenuItem>
                    <MenuItem value="C黨團">C黨團</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="committee-label">委員會</InputLabel>
                  <Select
                    labelId="committee-label"
                    name="committee"
                    value={formData.committee}
                    label="委員會"
                    onChange={handleChange}
                  >
                    <MenuItem value="社會福利及衛生環境委員會">社會福利及衛生環境委員會</MenuItem>
                    <MenuItem value="交通委員會">交通委員會</MenuItem>
                    <MenuItem value="財政委員會">財政委員會</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              新增用戶
            </Button>
          </form>
          {/* 新增返回上一頁按鈕 */}
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate(-1)}
          >
            返回上一頁
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddUser;