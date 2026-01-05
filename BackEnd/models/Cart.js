const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1,
    min: 1
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  totalPrice: { 
    type: Number, 
    default: 0,
    min: 0
  }
}, { 
  timestamps: true 
});

// Tính tổng giá tự động
cartSchema.methods.calculateTotal = function() {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.totalPrice;
};

module.exports = mongoose.model('Cart', cartSchema);