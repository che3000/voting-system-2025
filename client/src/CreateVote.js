// src/CreateVote.js
import React, { useState } from 'react';
import axios from './axiosConfig';
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
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CreateVote = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '', // 投票時長（分鐘）
    is_anonymous: true,
    target_group: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 格式化日期為 MySQL 的 DATETIME 格式: "YYYY-MM-DD HH:mm:ss"
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      ' ' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds())
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const start_time = new Date();
    const durationInMinutes = parseInt(formData.duration, 10);
    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
      setError("請輸入有效的投票時長（分鐘）");
      return;
    }
    const end_time = new Date(start_time.getTime() + durationInMinutes * 60000);
    const payload = {
      title: formData.title,
      description: formData.description,
      start_time: formatDate(start_time),
      end_time: formatDate(end_time),
      is_anonymous: formData.is_anonymous,
      target_group: formData.target_group || "ALL"
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/votes', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('投票建立成功');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('建立投票失敗');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            建立投票
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="標題"
              name="title"
              fullWidth
              margin="normal"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              label="描述"
              name="description"
              fullWidth
              margin="normal"
              value={formData.description}
              onChange={handleChange}
            />
            {/* 投票時長（分鐘） */}
            <TextField
              label="投票時長 (分鐘)"
              name="duration"
              type="number"
              fullWidth
              margin="normal"
              value={formData.duration}
              onChange={handleChange}
              required
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={handleChange}
                />
              }
              label="匿名投票"
              sx={{ mt: 2 }}
            />
            {/* 目標群組下拉選單 */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="target-group-label">目標群組</InputLabel>
              <Select
                labelId="target-group-label"
                name="target_group"
                value={formData.target_group}
                label="目標群組"
                onChange={handleChange}
              >
                <MenuItem value="A黨團">A黨團</MenuItem>
                <MenuItem value="B黨團">B黨團</MenuItem>
                <MenuItem value="C黨團">C黨團</MenuItem>
                <MenuItem value="社會福利及衛生環境委員會">社會福利及衛生環境委員會</MenuItem>
                <MenuItem value="交通委員會">交通委員會</MenuItem>
                <MenuItem value="財政委員會">財政委員會</MenuItem>
                <MenuItem value="院會">院會</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              建立投票
            </Button>
            {/* 新增返回 Dashboard 的按鈕 */}
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/dashboard')}
            >
              回到管理後台
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateVote;
