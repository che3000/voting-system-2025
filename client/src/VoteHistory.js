// src/VoteHistory.js
import React, { useEffect, useState } from 'react';
import axios from './axiosConfig';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Alert,
  Divider,
  Stack,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

const VoteHistory = () => {
  const [votes, setVotes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/votes/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVotes(response.data.votes);
      setError('');
    } catch (err) {
      console.error(err);
      setError('取得歷史投票資料失敗');
    }
    setLoading(false);
  };

  const handleDeleteVote = async (voteId) => {
    if (!window.confirm("確定要刪除此投票嗎？")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/votes/${voteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("投票已刪除");
      fetchHistory(); // 刪除後刷新列表
    } catch (err) {
      console.error(err);
      alert("刪除投票失敗");
    }
  };
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        回到管理後台
      </Button>
      <Box sx={{ position: 'absolute', top: 45, right: 35}}>
                    <Typography variant="h6">現在時間：{currentTime}</Typography>
                  </Box>
      <Typography variant="h4" gutterBottom>
        歷史投票紀錄
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Typography>載入中...</Typography>
      ) : votes.length === 0 ? (
        <Typography>目前沒有歷史投票資料。</Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List>
            {votes.map((vote, index) => (
              <React.Fragment key={vote.id}>
                
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div">
                    投票名稱：{vote.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    建立時間：{dayjs(vote.created_at).format('YYYY-MM-DD HH:mm')}
                  </Typography>
                  {vote.description && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {vote.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => navigate(`/vote/${vote.id}/details`)}>
                      查看詳情
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteVote(vote.id)}
                    >
                      刪除投票
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

export default VoteHistory;
