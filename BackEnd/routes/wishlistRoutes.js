const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;

// Tất cả routes đều cần authentication
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/add', wishlistController.addToWishlist);
router.delete('/clear', wishlistController.clearWishlist);  // MUST be before /:productId
router.delete('/:productId', wishlistController.removeFromWishlist);
router.get('/check/:productId', wishlistController.checkInWishlist);

module.exports = router;
