// src/Login.js
import React, { useState } from 'react';
import axios from './axiosConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });
      const token = response.data.token;
      //console.log('取得 token:', token);
      localStorage.setItem('token', token);
      // 解析 token 取得角色
      const decoded = jwtDecode(token);
      // 根據角色導向不同頁面
      if (decoded.role === 'user') {
        navigate('/user/dashboard');
      }
      else if (decoded.role === 'press') {
        navigate('/press/history');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('登入失敗，請檢查帳號密碼');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ minWidth: 300, padding: 2, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            2025青年國會立法院會議電子表決系統
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              label="使用者名稱"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="密碼"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} color="primary">
              登入
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
