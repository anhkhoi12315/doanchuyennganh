const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/adminUserController');
const { authenticate, adminOnly } = require('../../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Tất cả routes đều cần admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', adminUserController.getAllUsers);
router.get('/stats', adminUserController.getUserStats);
router.get('/:id', adminUserController.getUserById);
router.put('/:id', adminUserController.updateUser);
router.patch('/:id/toggle-status', adminUserController.toggleUserStatus);
router.patch('/:id/role', adminUserController.changeUserRole);
router.patch('/:id/reset-password', adminUserController.resetUserPassword);
router.delete('/:id', adminUserController.deleteUser);

module.exports = router;
