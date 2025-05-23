// src/AdminUsers.js
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from './axiosConfig';
import { Stack } from '@mui/material';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const roleMapping = {
  user: "一般委員",
  press: "國會媒體",
  admin: "管理員",
  superadmin: "超級管理員"
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      console.error(err);
      setError('取得用戶列表失敗');
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserRole(decoded.role);
      } catch (error) {
        console.error("Token decode error:", error);
      }
    }
    fetchUsers();
  }, []);

  const isActionDisabled = (userRole) => {
    const lowerUserRole = userRole.toLowerCase();
    // 如果當前使用者不是超級管理員，則不能操作 admin 或 superadmin 的帳戶
    const disabled = currentUserRole !== 'superadmin' && (lowerUserRole === 'admin' || lowerUserRole === 'superadmin');
    return disabled;
  };

  const handleDeleteClick = (user) => {
    if (isActionDisabled(user.role)) {
      alert("您沒有權限刪除此用戶");
      return;
    }
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('刪除用戶失敗');
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000); // 每秒更新一次
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      {/* 返回 Dashboard 按鈕 */}
      <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        回到管理後台
      </Button>
      <Box sx={{ position: 'absolute', top: 45, right: 35}}>
        <Typography variant="h6">現在時間：{currentTime}</Typography>
      </Box>
      <Typography variant="h4" gutterBottom>
        用戶管理
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* 新增用戶按鈕 */}
        <Button variant="contained" component={Link} to="/admin/users/add">
          新增用戶
        </Button>
        {/* 如果當前使用者是超級管理員，顯示 CSV 上傳按鈕 */}
        {currentUserRole === 'superadmin' && (
          <Button variant="contained" color="secondary" component={Link} to="/admin/users/upload-csv">
            CSV 批次上傳用戶
            
          </Button>
        )}
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Typography>載入中...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 750 }} aria-label="用戶表格">
            <TableHead>
              <TableRow>
                <TableCell>編號</TableCell>
                <TableCell>使用者ID</TableCell>
                <TableCell>中文姓名</TableCell>
                <TableCell>黨團</TableCell>
                <TableCell>委員會</TableCell>
                <TableCell>角色</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.chinese_name}</TableCell>
                    <TableCell>{user.party}</TableCell>
                    <TableCell>{user.committee}</TableCell>
                    <TableCell>{roleMapping[user.role] || user.role}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        component={Link}
                        to={`/admin/users/edit/${user.id}`}
                        aria-label="編輯用戶"
                        disabled={isActionDisabled(user.role)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(user)}
                        aria-label="刪除用戶"
                        disabled={isActionDisabled(user.role)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    目前沒有用戶資料。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser && (
              <>
                確定要刪除使用者ID: <strong>{selectedUser.username}</strong>，
                中文姓名: <strong>{selectedUser.chinese_name}</strong> 嗎？
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            取消
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;