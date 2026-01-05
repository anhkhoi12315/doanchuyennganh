const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// User routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.patch('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);
router.get('/admin/stats', authMiddleware, adminMiddleware, orderController.getOrderStats);

module.exports = router;
