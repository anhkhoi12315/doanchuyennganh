const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Public route
router.post('/', supportController.createSupport);

// User routes
router.get('/my-supports', authMiddleware, supportController.getUserSupports);
router.get('/:id', authMiddleware, supportController.getSupportById);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, supportController.getAllSupports);
router.get('/admin/stats', authMiddleware, adminMiddleware, supportController.getSupportStats);
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, supportController.updateSupportStatus);
router.post('/admin/:id/respond', authMiddleware, adminMiddleware, supportController.respondToSupport);

module.exports = router;
