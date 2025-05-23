// src/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      // 若角色不符合，顯示提示對話框後再跳轉
      return <RedirectWithDialog />;
    }
    return children;
  } catch (error) {
    console.error("Token decode failed:", error);
    return <Navigate to="/login" replace />;
  }
};

const RedirectWithDialog = () => {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirect(true);
    }, 3000); // 3 秒後進行跳轉
    return () => clearTimeout(timer);
  }, []);

  if (redirect) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Dialog open>
      <DialogTitle>訪問不合法</DialogTitle>
      <DialogContent>
        <DialogContentText>
          您沒有訪問此頁面的權限，系統將在 3 秒後跳轉回登入頁面。
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default ProtectedRoute;
