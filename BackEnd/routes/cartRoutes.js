const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

const authMiddleware = authenticate;

// Tất cả routes đều cần authentication
router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/item/:productId', cartController.updateCartItem);
router.delete('/item/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/merge', cartController.mergeCart);

module.exports = router;
