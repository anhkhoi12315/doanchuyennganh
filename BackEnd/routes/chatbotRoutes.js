const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     summary: Chat với AI chatbot
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Tin nhắn từ khách hàng
 *               conversationHistory:
 *                 type: array
 *                 description: Lịch sử hội thoại
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Trả lời thành công
 *       400:
 *         description: Thiếu tin nhắn
 *       500:
 *         description: Lỗi server
 */
router.post('/chat', optionalAuth, chatbotController.chat);

/**
 * @swagger
 * /api/chatbot/suggestions:
 *   get:
 *     summary: Lấy gợi ý sản phẩm
 *     tags: [Chatbot]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Loại trang sức (nhẫn, dây chuyền, etc.)
 *       - in: query
 *         name: budget
 *         schema:
 *           type: string
 *         description: Ngân sách
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *         description: Dịp sử dụng
 *     responses:
 *       200:
 *         description: Gợi ý thành công
 */
router.get('/suggestions', chatbotController.getProductSuggestions);

/**
 * @swagger
 * /api/chatbot/history:
 *   get:
 *     summary: Lấy lịch sử chat (yêu cầu đăng nhập)
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch sử chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/history', optionalAuth, chatbotController.getChatHistory);

/**
 * @swagger
 * /api/chatbot/admin/all-history:
 *   get:
 *     summary: [ADMIN] Lấy tất cả lịch sử chat của tất cả users
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả chat history
 */
router.get('/admin/all-history', authenticate, adminOnly, chatbotController.getAllChatHistory);

module.exports = router;
