const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String
  }],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    district: String,
    ward: String,
    notes: String
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "card", "momo", "zalopay", "banking"],
    default: "COD",
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipping", "delivered", "cancelled"],
    default: "pending",
    index: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  cancelReason: String,
  paymentDetails: {
    provider: String, // 'momo', 'vnpay', 'banking'
    transactionId: String,
    payUrl: String,
    paidAt: Date,
    amount: Number,
    resultCode: String,
    message: String,
    bankCode: String,
    cardType: String
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true 
});

// Tự động tạo order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${dateStr}${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
