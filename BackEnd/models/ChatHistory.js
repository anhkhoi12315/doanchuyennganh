const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null nếu là guest
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    products: [{
      id: String,
      name: String,
      slug: String,
      price: Number,
      originalPrice: Number,
      image: String,
      category: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tự động xóa lịch sử chat sau 1 ngày
chatHistorySchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 }); // 86400 giây = 1 ngày

// Update lastActivity khi có tin nhắn mới
chatHistorySchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
