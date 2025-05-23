// client/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminUsers from './AdminUsers';
import AddUser from './AddUser';
import EditUser from './EditUser';
import CreateVote from './CreateVote';
import VotePage from './VotePage';
import VoteHistory from './VoteHistory';
import PressHistory from './PressHistory';
import ProtectedRoute from './ProtectedRoute';
import VoteData from './VoteData';
import UserDashboard from './UserDashboard';
import SetupSuperAdmin from './SetupSuperAdmin';
import UploadUsersCSV from './UploadUasersCSV';
import './axiosConfig';

function RootChecker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        // 呼叫後端的 superadmin 路由
        const res = await axios.get('/api/superadmin/exists');
        console.log("checkSuperAdmin response:", res.data);
        if (!res.data.exists) {
          // 如果沒有超級管理員，先顯示 Dialog
          setOpenDialog(true);
        } else {
          // 超級管理員存在，直接導向登入頁
          navigate('/login');
        }
      } catch (error) {
        console.error("Error checking super admin:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSuperAdmin();
  }, [navigate]);

  const handleDialogClose = () => {
    setOpenDialog(false);
    // 跳轉到設定超級管理員的頁面
    navigate('/setup');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>超級管理員尚未建立</DialogTitle>
        <DialogContent>
          <Typography>
            系統尚未檢測到超級管理員，請先建立一個超級管理員帳戶以便繼續使用系統。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} variant="contained" color="primary">
            確認
          </Button>
        </DialogActions>
      </Dialog>
      <Login />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 根目錄會自動檢查是否有超級管理員 */}
        <Route path="/" element={<RootChecker />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-vote"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <CreateVote />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/upload-csv"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <UploadUsersCSV />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/add"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <EditUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote/:voteId"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user', '國會媒體', 'superadmin']}>
              <VotePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote-history"
          element={
            <ProtectedRoute allowedRoles={['press', 'admin', 'superadmin']}>
              <VoteHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/setup" element={<SetupSuperAdmin />} />
        <Route
          path="/vote/:voteId/details"
          element={
            <ProtectedRoute allowedRoles={['press', 'admin', 'superadmin']}>
              <VoteData />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/press/history"
          element={
            <ProtectedRoute allowedRoles={['press', 'admin', 'superadmin']}>
              <PressHistory />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;