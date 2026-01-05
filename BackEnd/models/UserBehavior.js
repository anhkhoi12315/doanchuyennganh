const mongoose = require('mongoose');

const userBehaviorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  eventType: {
    type: String,
    enum: ['view', 'search', 'click', 'add_to_cart', 'wishlist', 'purchase'],
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  searchQuery: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userAgent: String,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index cho query phân tích
userBehaviorSchema.index({ user: 1, timestamp: -1 });
userBehaviorSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('UserBehavior', userBehaviorSchema);
