const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/adminOrderController');
const { authenticate, adminOnly } = require('../../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Tất cả routes đều cần admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin order routes
router.get('/', adminOrderController.getAllOrders);
router.get('/stats', adminOrderController.getOrderStats);
router.get('/:orderId', adminOrderController.getOrderById);
router.patch('/:orderId/status', adminOrderController.updateOrderStatus);
router.delete('/:orderId', adminOrderController.deleteOrder);

module.exports = router;
