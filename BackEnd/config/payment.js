// Payment Gateway Configuration
// Cấu hình cho MoMo và VNPay

module.exports = {
  // MoMo Configuration
  momo: {
    // Test credentials - Thay bằng credentials thật từ MoMo Developer
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529",
    accessKey: process.env.MOMO_ACCESS_KEY || "klm05TvNBzhg7h7j",
    secretKey: process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    
    // Callback URLs - Cập nhật domain của bạn
    returnUrl: process.env.MOMO_RETURN_URL || "http://localhost:5000/api/payment/momo/callback",
    notifyUrl: process.env.MOMO_NOTIFY_URL || "http://localhost:5000/api/payment/momo/notify",
    
    // Request type
    requestType: "captureWallet",
    
    // MoMo QR Info - Cho manual transfer
    phoneNumber: process.env.MOMO_PHONE || "0369604155",
    accountName: "NGUYEN ANH KHOI"
  },

  // VNPay Configuration  
  vnpay: {
    // Test credentials - Thay bằng credentials thật từ VNPay
    tmnCode: process.env.VNPAY_TMN_CODE || "DEMOSHOP",
    hashSecret: process.env.VNPAY_HASH_SECRET || "QWERTYUIOPASDFGHJKLZXCVBNM123456",
    url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    
    // Return URL
    returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment-result.html",
    
    // API Version
    version: "2.1.0",
    command: "pay",
    currCode: "VND",
    locale: "vn"
  },

  // Banking Configuration (Manual bank transfer)
  banking: {
    // Thông tin tài khoản ngân hàng nhận tiền
    bankName: "Vietcombank",
    bankCode: "VCB", // Mã ngân hàng để tạo VietQR
    accountNumber: "1032987715",
    accountName: "NGUYEN ANH KHOI",
    branch: "Chi nhánh Bình Tân",
    
    // QR Code sẽ được generate tự động qua VietQR API
    qrCodeUrl: null // Không cần thiết nữa, sẽ dùng VietQR API
  }
};
