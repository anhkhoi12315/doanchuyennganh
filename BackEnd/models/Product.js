const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  slug: { 
    type: String, 
    unique: true,
    index: true 
  },
  description: { 
    type: String,
    default: ""
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    default: null,
    min: 0
  },
  images: {
    type: [String],
    default: []
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  material: {
    type: String,
    enum: ["gold", "silver", "diamond", "platinum", "pearl", "gemstone", "mixed"],
    default: "silver"
  },
  style: {
    type: String,
    enum: ["classic", "modern", "vintage", "minimalist", "luxury"],
    default: "modern"
  },
  stock: { 
    type: Number, 
    default: 0,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  weight: Number, // trọng lượng (gram)
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, { 
  timestamps: true 
});

// Index cho tìm kiếm
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Tự động tạo slug từ name
productSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    // Tạo slug cơ bản
    let baseSlug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Kiểm tra slug đã tồn tại chưa, nếu có thì thêm số
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
