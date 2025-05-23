// client/src/SetupSuperAdmin.js
import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SetupSuperAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    chinese_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 檢查是否已存在超級管理員
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const res = await axios.get('/api/superadmin/exists');
        console.log("checkSuperAdmin response:", res.data);
        if (res.data.exists) {
          navigate('/login');
        }
      } catch (err) {
        console.error("Error checking super admin:", err);
      }
    };
    checkSuperAdmin();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/superadmin/setup', formData);
      console.log("setupSuperAdmin response:", res.data);
      window.alert("超級管理員建立成功！請登入");
      navigate('/login');
    } catch (err) {
      console.error("Error in setupSuperAdmin:", err);
      setError(err.response?.data.message || '設定失敗');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 6, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            初始設定 - 建立超級管理員
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="使用者ID"
              name="username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#fff', borderRadius: 1 }}
            />
            <TextField
              label="中文姓名"
              name="chinese_name"
              fullWidth
              margin="normal"
              value={formData.chinese_name}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#fff', borderRadius: 1 }}
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
              sx={{ backgroundColor: '#fff', borderRadius: 1 }}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}>
              建立超級管理員
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SetupSuperAdmin;