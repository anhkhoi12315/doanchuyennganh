const express = require('express');
const router = express.Router();
const behaviorController = require('../controllers/behaviorController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Public route - track behavior (có thể dùng khi chưa đăng nhập)
router.post('/track', behaviorController.trackBehavior);

// Admin routes
router.get('/stats', authMiddleware, adminMiddleware, behaviorController.getBehaviorStats);
router.get('/user/:userId', authMiddleware, behaviorController.getUserBehavior);

module.exports = router;
