// src/EditUser.js
import React, { useState, useEffect, useCallback } from 'react';
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
import axios from './axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';

const roleMapping = {
  superadmin: "超級管理員",
  admin: "管理員",
  press: "國會媒體",
  user: "一般委員"
};

const reverseRoleMapping = {
  "超級管理員": "superadmin",
  "管理員": "admin",
  "國會媒體": "press",
  "一般委員": "user"
};

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    chinese_name: '',
    password: '',
    party: '',
    committee: '',
    role: ''
  });
  const [originalData, setOriginalData] = useState({
    party: '',
    committee: '',
    chinese_name: '',
    role: ''
  });
  const [error, setError] = useState('');

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data.users.find((u) => u.id === Number(id));
      if (user) {
        // 將後端角色轉換為 UI 顯示值
        const uiRole = roleMapping[user.role] || user.role;
        setFormData({
          username: user.username,
          chinese_name: user.chinese_name || '',
          password: '',
          party: user.party || '',
          committee: user.committee || '',
          role: uiRole,
        });
        setOriginalData({
          party: user.party || '',
          committee: user.committee || '',
          chinese_name: user.chinese_name || '',
          role: uiRole,
        });
      } else {
        setError('找不到該用戶');
      }
    } catch (err) {
      console.error(err);
      setError('取得用戶資料失敗');
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [id, fetchUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      // 當角色改變時
      if (value === '國會媒體' || value === '管理員') {
        // 若改成國會媒體或管理員，清空黨團與委員會，但保留中文姓名不變
        setFormData({
          ...formData,
          role: value,
          party: '',
          committee: '',
        });
      } else if (value === '一般委員') {
        // 切換回一般委員時，如果黨團、委員會或中文姓名為空，恢復原始資料
        setFormData({
          ...formData,
          role: value,
          party: formData.party || originalData.party,
          committee: formData.committee || originalData.committee,
          chinese_name: formData.chinese_name || originalData.chinese_name,
        });
      } else {
        setFormData({
          ...formData,
          role: value,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // 將 UI 的角色轉換回後端使用的值
      const backendRole = reverseRoleMapping[formData.role] || formData.role;
      const payload = { ...formData, role: backendRole };
      await axios.put(`/api/admin/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('用戶更新成功');
      navigate('/admin/users');
    } catch (err) {
      console.error(err);
      setError('用戶更新失敗');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ maxWidth: 500, mx: 'auto', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            編輯用戶
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            {/* 角色下拉選單 */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">角色</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleChange}
              >
                <MenuItem value="超級管理員">超級管理員</MenuItem>
                <MenuItem value="一般委員">一般委員</MenuItem>
                <MenuItem value="國會媒體">國會媒體</MenuItem>
                <MenuItem value="管理員">管理員</MenuItem>
              </Select>
            </FormControl>

            {/* 使用者ID */}
            <TextField
              label="使用者ID"
              name="username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleChange}
              required
            />

            {/* 中文姓名 */}
            <TextField
              label="中文姓名"
              name="chinese_name"
              fullWidth
              margin="normal"
              value={formData.chinese_name}
              onChange={handleChange}
              required
            />

            {/* 密碼 (若修改請填寫) */}
            <TextField
              label="密碼 (若修改請填寫)"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
            />

            {/* 僅當角色為「一般委員」時顯示黨團與委員會 */}
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
              更新用戶
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditUser;
