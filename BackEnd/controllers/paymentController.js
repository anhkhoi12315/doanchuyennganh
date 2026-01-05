const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');
const paymentConfig = require('../config/payment');
const { generateVietQRUrl, generateMoMoQR } = require('../utils/vietqr');

// ===== MoMo Payment =====

// Tạo thanh toán MoMo
exports.createMoMoPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    // Validate order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    // MoMo payment parameters
    const {
      partnerCode,
      accessKey,
      secretKey,
      endpoint,
      returnUrl,
      notifyUrl,
      requestType
    } = paymentConfig.momo;

    const requestId = partnerCode + new Date().getTime();
    const orderId_momo = requestId; // MoMo orderId
    const orderInfo_momo = orderInfo || `Thanh toán đơn hàng ${order.orderNumber}`;
    const redirectUrl = returnUrl;
    const ipnUrl = notifyUrl;
    const extraData = JSON.stringify({ orderId: orderId }); // Lưu orderId của chúng ta

    // Create signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId_momo}&orderInfo=${orderInfo_momo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Request body
    const requestBody = {
      partnerCode,
      partnerName: "Bán Trang Sức",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId: orderId_momo,
      orderInfo: orderInfo_momo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature
    };

    // Send request to MoMo
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Update order with payment info
    order.paymentDetails = {
      provider: 'momo',
      transactionId: requestId,
      payUrl: response.data.payUrl
    };
    await order.save();

    return res.json({
      success: true,
      message: 'Tạo thanh toán MoMo thành công',
      data: {
        payUrl: response.data.payUrl,
        orderId: orderId,
        transactionId: requestId
      }
    });

  } catch (error) {
    console.error('MoMo payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo thanh toán MoMo',
      error: error.message
    });
  }
};

// MoMo Callback/Notify handler
exports.momoCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body;

    console.log('MoMo callback received:', req.body);

    // Verify signature
    const { secretKey } = paymentConfig.momo;
    const rawSignature = `accessKey=${paymentConfig.momo.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const validSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== validSignature) {
      console.error('Invalid MoMo signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Parse extraData to get our orderId
    let ourOrderId;
    try {
      const extra = JSON.parse(extraData);
      ourOrderId = extra.orderId;
    } catch (e) {
      console.error('Error parsing extraData:', e);
    }

    if (!ourOrderId) {
      return res.status(400).json({ success: false, message: 'Order ID not found' });
    }

    // Update order payment status
    const order = await Order.findById(ourOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // resultCode = 0: Success
    if (resultCode === 0 || resultCode === '0') {
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        provider: 'momo',
        transactionId: transId,
        paidAt: new Date(),
        amount: amount,
        resultCode: resultCode,
        message: message
      };
    } else {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        provider: 'momo',
        transactionId: transId,
        resultCode: resultCode,
        message: message
      };
    }

    await order.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-update', {
        orderId: ourOrderId,
        status: order.paymentStatus
      });
    }

    return res.json({ success: true, message: 'Callback processed' });

  } catch (error) {
    console.error('MoMo callback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  }
};

// ===== VNPay Payment =====

// Tạo thanh toán VNPay
exports.createVNPayPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, bankCode } = req.body;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const { tmnCode, hashSecret, url, returnUrl, version, command, currCode, locale } = paymentConfig.vnpay;

    // Create payment URL
    let vnpParams = {
      vnp_Version: version,
      vnp_Command: command,
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount * 100, // VNPay amount in VND smallest unit (xu)
      vnp_CreateDate: formatDate(new Date()),
      vnp_CurrCode: currCode,
      vnp_IpAddr: req.ip || req.connection.remoteAddress || '127.0.0.1',
      vnp_Locale: locale,
      vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng ${order.orderNumber}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: `${returnUrl}?orderId=${orderId}`,
      vnp_TxnRef: `${Date.now()}_${orderId}` // Transaction reference
    };

    if (bankCode) {
      vnpParams.vnp_BankCode = bankCode;
    }

    // Sort params alphabetically
    const sortedParams = sortObject(vnpParams);

    // Create signature
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    sortedParams.vnp_SecureHash = signed;

    // Build payment URL
    const paymentUrl = url + '?' + new URLSearchParams(sortedParams).toString();

    // Update order with payment info
    order.paymentDetails = {
      provider: 'vnpay',
      transactionId: vnpParams.vnp_TxnRef,
      payUrl: paymentUrl
    };
    await order.save();

    return res.json({
      success: true,
      message: 'Tạo thanh toán VNPay thành công',
      data: {
        payUrl: paymentUrl,
        orderId: orderId,
        transactionId: vnpParams.vnp_TxnRef
      }
    });

  } catch (error) {
    console.error('VNPay payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo thanh toán VNPay',
      error: error.message
    });
  }
};

// VNPay Return URL handler
exports.vnpayReturn = async (req, res) => {
  try {
    let vnpParams = req.query;
    const secureHash = vnpParams['vnp_SecureHash'];

    // Remove hash params
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort params
    vnpParams = sortObject(vnpParams);

    // Verify signature
    const { hashSecret } = paymentConfig.vnpay;
    const signData = new URLSearchParams(vnpParams).toString();
    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      console.error('Invalid VNPay signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const orderId = vnpParams['orderId']; // From returnUrl query
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionId = vnpParams['vnp_TransactionNo'];

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID not found' });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // responseCode = '00': Success
    if (responseCode === '00') {
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        provider: 'vnpay',
        transactionId: transactionId,
        paidAt: new Date(),
        amount: vnpParams['vnp_Amount'] / 100,
        responseCode: responseCode,
        bankCode: vnpParams['vnp_BankCode'],
        cardType: vnpParams['vnp_CardType']
      };
    } else {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        provider: 'vnpay',
        transactionId: transactionId,
        responseCode: responseCode
      };
    }

    await order.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-update', {
        orderId: orderId,
        status: order.paymentStatus
      });
    }

    // Redirect to success page
    return res.redirect(`/payment-result.html?orderId=${orderId}&status=${order.paymentStatus}`);

  } catch (error) {
    console.error('VNPay return error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing return',
      error: error.message
    });
  }
};

// ===== Check Payment Status =====
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    return res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentDetails: order.paymentDetails || {},
        total: order.total,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái thanh toán',
      error: error.message
    });
  }
};

// Get bank transfer info
exports.getBankTransferInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const bankInfo = paymentConfig.banking;
    const transferContent = `${order.orderNumber}`;
    
    // Generate VietQR URL
    const qrCodeUrl = generateVietQRUrl({
      bankId: bankInfo.bankCode,
      accountNumber: bankInfo.accountNumber,
      accountName: bankInfo.accountName,
      amount: order.total,
      description: transferContent,
      template: 'compact2'
    });

    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        amount: order.total,
        bankInfo: {
          bankName: bankInfo.bankName,
          bankCode: bankInfo.bankCode,
          accountNumber: bankInfo.accountNumber,
          accountName: bankInfo.accountName,
          branch: bankInfo.branch,
          qrCodeUrl: qrCodeUrl,
          content: transferContent
        }
      }
    });

  } catch (error) {
    console.error('Get bank transfer info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin chuyển khoản',
      error: error.message
    });
  }
};

// Get MoMo transfer info
exports.getMoMoTransferInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const momoInfo = paymentConfig.momo;
    const transferContent = `${order.orderNumber}`;
    
    // Generate MoMo QR Code
    const qrCodeDataUrl = await generateMoMoQR({
      phoneNumber: momoInfo.phoneNumber,
      amount: order.total,
      description: transferContent
    });

    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        amount: order.total,
        momoInfo: {
          phoneNumber: momoInfo.phoneNumber,
          accountName: momoInfo.accountName,
          qrCodeDataUrl: qrCodeDataUrl,
          content: transferContent
        }
      }
    });

  } catch (error) {
    console.error('Get MoMo transfer info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin MoMo',
      error: error.message
    });
  }
};

// ===== Helper Functions =====

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}
