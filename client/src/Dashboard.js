// src/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Grid, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const AdminDashboard = () => {
  const [adminName, setAdminName] = useState('');
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAdminName(decoded.chinese_name || decoded.username);
      } catch (error) {
        console.error('Token decode failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000); // 每秒更新一次

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ position: 'absolute', top: 45, right: 35}}>
              <Typography variant="h6">現在時間：{currentTime}</Typography>
            </Box>
            <Typography variant="h4" gutterBottom>
              管理後台
            </Typography>
            <Typography variant="h6" gutterBottom>
              {adminName} 你好
            </Typography>
          </Box>
          <Button variant="contained" color="error" onClick={handleLogout}>
            登出
          </Button>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                color="primary"
                onClick={() => navigate('/create-vote')}
                sx={{ py: 2 }}
              >
                建立投票
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                color="secondary"
                onClick={() => navigate('/admin/users')}
                sx={{ py: 2 }}
              >
                用戶管理
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/vote-history')}
                sx={{ py: 2 }}
              >
                歷史投票紀錄
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
