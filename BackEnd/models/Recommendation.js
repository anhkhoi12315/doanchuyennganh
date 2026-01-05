const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
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
  userInput: {
    age: Number,
    gender: String,
    occasion: String, // Dịp: "birthday", "wedding", "anniversary", "gift", "daily"
    style: [String], // Phong cách yêu thích
    priceRange: {
      min: Number,
      max: Number
    },
    material: [String], // Chất liệu ưa thích
    recipient: String // Người nhận: "self", "partner", "family", "friend"
  },
  recommendedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    score: Number,
    reason: String
  }],
  clicked: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    timestamp: Date
  }],
  purchased: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    timestamp: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
