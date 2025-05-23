// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminOnly, superadminOnly } = require('../middleware/authMiddleware');

// 允許未登入的使用者存取 /superadmin/setup
router.post('/superadmin/setup', adminController.setupSuperAdmin);
router.get('/superadmin-exists', adminController.checkSuperAdminExists);

// 其餘 API 需要管理員權限
router.use(adminOnly);
router.post('/users', adminController.createUser);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id', adminController.updateUser);

router.post('/users/upload-csv', superadminOnly, adminController.uploadUsersCSV);

module.exports = router;
