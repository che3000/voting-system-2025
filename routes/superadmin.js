// routes/superadmin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 不需要驗證，方便初始設定使用
router.get('/exists', adminController.checkSuperAdminExists);
router.post('/setup', adminController.setupSuperAdmin);

// 新增 CSV 上傳路由（僅限超級管理員使用，可以依需求加上權限中介層）
router.post('/users/upload-csv', adminController.uploadUsersCSV);

module.exports = router;