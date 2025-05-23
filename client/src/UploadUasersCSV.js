// client/src/UploadUsersCSV.js
import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Alert } from '@mui/material';
import axios from './axiosConfig';
import { useNavigate } from 'react-router-dom';

const UploadUsersCSV = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('請選擇一個 CSV 檔案');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/admin/users/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data.message || 'CSV 上傳失敗');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            CSV 批次上傳用戶
          </Typography>
          <Typography>
            CSV 欄位：role, username, chinese_name, password, party, committee
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          <form onSubmit={handleSubmit}>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              style={{ marginBottom: '1rem' }}
            />
            <Button type="submit" variant="contained" fullWidth>
              上傳 CSV
            </Button>
          </form>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              返回上一頁
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UploadUsersCSV;