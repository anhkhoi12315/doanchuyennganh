const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const multerMiddleware = require('../middleware/multerMiddleware');

const authMiddleware = authenticate;
const adminMiddleware = adminOnly;

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/best-sellers', productController.getBestSellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, multerMiddleware.array('images', 5), productController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, multerMiddleware.array('images', 5), productController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);
router.patch('/:id/stock', authMiddleware, adminMiddleware, productController.updateStock);

module.exports = router;
