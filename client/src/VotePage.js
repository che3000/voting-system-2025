// src/VotePage.js
import React, { useState } from 'react';
import axios from './axiosConfig';
import { Box, Button, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const VotePage = () => {
  const { voteId } = useParams();
  console.log("voteId:", voteId);
  const [voteChoice, setVoteChoice] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/votes/${voteId}/attendance`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('出席登記成功');
    } catch (err) {
      console.error(err);
      setError('出席登記失敗');
    }
  };

  const handleVote = async () => {
    if (!voteChoice) {
      setError('請選擇投票選項');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/votes/${voteId}/cast`, { vote_choice: voteChoice }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('投票成功');
    } catch (err) {
      console.error(err);
      setError('投票失敗');
    }
  };

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/votes/${voteId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('查詢結果失敗');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        投票參與頁面
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="contained" onClick={handleAttendance} sx={{ mb: 2 }}>
        出席登記
      </Button>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">選擇投票選項</FormLabel>
        <RadioGroup
          name="voteChoice"
          value={voteChoice}
          onChange={(e) => setVoteChoice(e.target.value)}
        >
          <FormControlLabel value="approve" control={<Radio />} label="贊成" />
          <FormControlLabel value="reject" control={<Radio />} label="反對" />
          <FormControlLabel value="abstain" control={<Radio />} label="棄權" />
        </RadioGroup>
      </FormControl>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleVote}>
          提交投票
        </Button>
        <Button variant="outlined" onClick={fetchResults}>
          查詢投票結果
        </Button>
      </Box>
      {result && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">投票結果：</Typography>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
};

export default VotePage;
