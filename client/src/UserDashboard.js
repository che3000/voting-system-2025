// src/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Alert, Stack } from '@mui/material';
import axios from './axiosConfig';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [user, setUser] = useState({ name: '', role: '', party: '', committee: '' });
  const [votes, setVotes] = useState([]);
  const [attended, setAttended] = useState({}); // 存放各投票是否已出席
  const [voted, setVoted] = useState({});       // 存放各投票使用者的選項
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  // 從 token 中解析使用者資料
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.chinese_name || decoded.username,
          role: decoded.role,
          party: decoded.party || '',
          committee: decoded.committee || ''
        });
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
  }, []);

  // 取得開放中的投票
  const fetchActiveVotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/votes/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 假設 response.data.votes 為投票陣列
      const sortedVotes = response.data.votes.sort(
        (a, b) => new Date(b.start_time) - new Date(a.start_time)
      );
      setVotes(sortedVotes);
      // 更新 attended 與 voted 狀態
      const newAttended = {};
      const newVoted = {};
      sortedVotes.forEach(vote => {
        if (vote.attended === 1) {
          newAttended[vote.id] = true;
        }
        if (vote.user_vote) {
          newVoted[vote.id] = vote.user_vote;
        }
      });
      setAttended(newAttended);
      setVoted(newVoted);
      setError('');
    } catch (err) {
      console.error(err);
      setError('取得投票資料失敗');
    }
    setLoading(false);
  };
  useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
        }, 1000); // 每秒更新一次
    
        return () => clearInterval(timer);
      }, []);

  // 當 user state 更新後再呼叫 fetchActiveVotes
  useEffect(() => {
    if (user && user.role) {
      fetchActiveVotes();
    }
  }, [user]);

  // 處理「出席」操作
  const handleAttendance = async (voteId) => {
    if (attended[voteId]) {
      alert('您已經出席過了');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/votes/${voteId}/attendance`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttended(prev => ({ ...prev, [voteId]: true }));
      alert('出席登記成功，現在您可以進行投票');
    } catch (err) {
      console.error(err);
      alert('出席登記失敗');
    }
  };

  // 處理投票操作
  const handleVote = async (voteId, voteChoice) => {
    if (!attended[voteId]) {
      alert('請先點擊出席');
      return;
    }
    if (voted[voteId] !== undefined) {
      alert('您已投票，選項已鎖定');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/votes/${voteId}/cast`, { vote_choice: voteChoice }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoted(prev => ({ ...prev, [voteId]: voteChoice }));
      alert('投票成功');
    } catch (err) {
      console.error(err);
      alert('投票失敗');
    }
  };

  // 處理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // 根據 voted 狀態來渲染投票按鈕
  const renderVoteButton = (voteId, option, label) => {
    const hasVoted = voted[voteId] !== undefined;
    const selected = voted[voteId] === option;
    const disabled = !attended[voteId] || hasVoted;
    return (
      <Button 
        variant={selected ? "contained" : "outlined"}
        color={selected ? "success" : (hasVoted ? "secondary" : "primary")}
        disabled={disabled}
        onClick={() => handleVote(voteId, option)}
      >
        {label}
      </Button>
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3, mt: 4 }}  // 增加 mt: 4，讓按鈕群向下移動
      >
        <Box sx={{ position: 'absolute', top: 45, right: 35 }}>
          <Typography variant="h6">現在時間：{currentTime}</Typography>
        </Box>
        <Typography variant="h4">
          你好 {user.name} 委員您好
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={fetchActiveVotes}>
            刷新
          </Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            登出
          </Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Typography>載入中...</Typography>
      ) : votes.length === 0 ? (
        <Typography>目前沒有開放中的投票</Typography>
      ) : (
        <Grid container spacing={3}>
          {votes.map(vote => (
            <Grid item xs={12} md={6} key={vote.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{vote.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(vote.start_time).format('YYYY-MM-DD HH:mm')} 至 {dayjs(vote.end_time).format('YYYY-MM-DD HH:mm')}
                  </Typography>
                  {vote.description && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {vote.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleAttendance(vote.id)}
                      disabled={!!attended[vote.id]}
                    >
                      {attended[vote.id] ? '已出席' : '出席'}
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    {renderVoteButton(vote.id, 'approve', '贊成')}
                    {renderVoteButton(vote.id, 'reject', '反對')}
                    {renderVoteButton(vote.id, 'abstain', '棄權')}
                  </Stack>
                  {voted[vote.id] !== undefined && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      您已投票，選項已鎖定
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UserDashboard;
