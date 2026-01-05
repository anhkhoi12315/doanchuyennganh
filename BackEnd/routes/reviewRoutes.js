const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// User routes
router.post('/', authMiddleware, reviewController.createReview);
router.put('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);
router.post('/:id/like', reviewController.likeReview);

// Admin routes
router.patch('/:id/approve', authMiddleware, adminMiddleware, reviewController.approveReview);

module.exports = router;
