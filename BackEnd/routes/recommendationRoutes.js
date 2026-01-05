const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;

// Public routes (có thể dùng khi chưa đăng nhập)
router.post('/get-recommendations', recommendationController.getRecommendations);
router.post('/chatbot', recommendationController.chatbotResponse);
router.post('/chatbot-form', recommendationController.getChatbotRecommendations); // NEW: Chatbot form

// User routes (cần đăng nhập)
router.get('/personalized', authMiddleware, recommendationController.getPersonalizedRecommendations);

module.exports = router;
