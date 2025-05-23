// client/src/PressHistory.js
import React, { useEffect, useState } from 'react';
import axios from './axiosConfig'; // 使用統一設定好的 axios 實例
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Divider,
  Stack,
  Button,
  List,
  ListItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PressHistory = () => {
  const [votes, setVotes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pressName, setPressName] = useState('');
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const navigate = useNavigate();

  // 取得 token 中的使用者名稱 (中文姓名優先)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setPressName(decoded.chinese_name || decoded.username);
      } catch (error) {
        console.error('Token decode failed:', error);
      }
    }
  }, []);

  // 每秒更新當前時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 取得歷史投票資料
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/votes/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVotes(response.data.votes);
      setError('');
    } catch (err) {
      console.error(err);
      setError('取得歷史投票資料失敗');
    }
    setLoading(false);
  };

  // 初次載入時呼叫 fetchHistory
  useEffect(() => {
    fetchHistory();
  }, []);

  // 登出處理
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* 右上角顯示當前時間 */}
      <Box sx={{ position: 'absolute', top: 45, right: 35 }}>
        <Typography variant="h6">現在時間：{currentTime}</Typography>
      </Box>

      <Typography variant="h4" gutterBottom>
        國會媒體－歷史投票紀錄
      </Typography>

      {/* 問候語與登出按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {pressName} 你好
        </Typography>
        <Button variant="contained" color="error" onClick={handleLogout}>
          登出
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Typography>載入中...</Typography>
      ) : votes.length === 0 ? (
        <Typography>目前沒有歷史投票資料。</Typography>
      ) : (
        <Paper sx={{ p: 0 }}>
          <List>
            {votes.map((vote, index) => (
              <React.Fragment key={vote.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <Typography variant="h6">{vote.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    建立時間：{dayjs(vote.created_at).format('YYYY-MM-DD HH:mm')}
                  </Typography>
                  {/* 若投票描述不為空則顯示 */}
                  {vote.description && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {vote.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => navigate(`/vote/${vote.id}/details`)}>
                      查看詳情
                    </Button>
                  </Stack>
                </ListItem>
                {index < votes.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default PressHistory;