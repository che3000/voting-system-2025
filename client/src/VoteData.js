// src/VoteData.js
import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const VoteData = () => {
  const { voteId } = useParams();
  const navigate = useNavigate();
  const [voteSummary, setVoteSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 使用 useCallback 包裝 fetchVoteSummary
  const fetchVoteSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/votes/${voteId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Vote summary:", res.data);
      setVoteSummary(res.data);
    } catch (err) {
      console.error(err);
      setError('取得投票結果失敗');
    }
  }, [voteId]);

  // 使用 useCallback 包裝 fetchVoteRecords
  const fetchVoteRecords = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/votes/${voteId}/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Vote records:", res.data.records);
      setRecords(res.data.records);
    } catch (err) {
      console.error(err);
      setRecords([]);
    }
  }, [voteId]);

  useEffect(() => {
    if (voteId) {
      setLoading(true);
      // 等待兩個函式都完成後，再將 loading 設定為 false
      Promise.all([fetchVoteSummary(), fetchVoteRecords()])
        .finally(() => setLoading(false));
    }
  }, [voteId, fetchVoteRecords, fetchVoteSummary]);

  // 準備圓餅圖數據
  const attendanceData = voteSummary ? [
    { name: '出席', value: Number(voteSummary.totalPresent) },
    { name: '缺席', value: Number(voteSummary.totalVoters) - Number(voteSummary.totalPresent) }
  ] : [];

  const voteRatioData = voteSummary ? [
    { name: '贊成', value: Number(voteSummary.approve) },
    { name: '反對', value: Number(voteSummary.reject) },
    { name: '棄權', value: Number(voteSummary.abstain) }
  ] : [];

  // 檢查票數總和
  const voteTotal = voteRatioData.reduce((acc, item) => acc + item.value, 0);

  const voteChoiceMapping = {
    approve: '贊成',
    reject: '反對',
    abstain: '棄權'
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">投票詳情</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>返回</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading || !voteSummary ? (
        <Typography>載入中...</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{voteSummary.title || '無標題'}</Typography>
            {voteSummary.description && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {voteSummary.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              建立時間：{dayjs(voteSummary.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              結束時間：{dayjs(voteSummary.end_time).format('YYYY-MM-DD HH:mm:ss')}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              投票類型：{voteSummary.is_anonymous ? "匿名投票" : "非匿名投票"}
            </Typography>
            <Typography variant="body1">
              出席率：{voteSummary.attendanceRate}%
            </Typography>
            <Typography variant="body1">
              贊成：{voteSummary.approve}  反對：{voteSummary.reject}  棄權：{voteSummary.abstain}
            </Typography>
          </Paper>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  出席率圖
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  投票比例圖
                </Typography>
                {voteTotal > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={voteRatioData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {voteRatioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography>無投票記錄</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          {!voteSummary.is_anonymous ? (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>投票記錄</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>編號</TableCell>
                      <TableCell>使用者ID</TableCell>
                      <TableCell>中文姓名</TableCell>
                      <TableCell>黨團</TableCell>
                      <TableCell>委員會</TableCell>
                      <TableCell>選項</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.length > 0 ? (
                      records.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{record.username}</TableCell>
                          <TableCell>{record.chinese_name}</TableCell>
                          <TableCell>{record.party}</TableCell>
                          <TableCell>{record.committee}</TableCell>
                          <TableCell>{voteChoiceMapping[record.vote_choice] || record.vote_choice}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">沒有投票記錄</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>此投票為匿名投票，無法顯示個別投票記錄。</Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default VoteData;