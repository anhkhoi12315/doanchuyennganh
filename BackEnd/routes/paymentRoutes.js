const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Payment routes working' });
});

// Require controller
const paymentController = require('../controllers/paymentController');

// MoMo routes
router.post('/momo/create', authenticate, paymentController.createMoMoPayment);
router.post('/momo/callback', paymentController.momoCallback);
router.post('/momo/notify', paymentController.momoCallback);

// VNPay routes
router.post('/vnpay/create', authenticate, paymentController.createVNPayPayment);
router.get('/vnpay/return', paymentController.vnpayReturn);

// Check payment status
router.get('/:orderId/status', authenticate, paymentController.checkPaymentStatus);

// Get bank transfer info
router.get('/:orderId/bank-info', authenticate, paymentController.getBankTransferInfo);

// Get MoMo transfer info
router.get('/:orderId/momo-info', authenticate, paymentController.getMoMoTransferInfo);

module.exports = router;



