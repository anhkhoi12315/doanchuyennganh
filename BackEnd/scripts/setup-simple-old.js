// Simple setup database without slug
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Simple schemas without slug
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  fullname: String,
  phone: String,
  address: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  salePrice: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [String],
  material: String,
  style: String,
  stock: Number,
  weight: Number,
  sold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty: Number
  }]
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number,
    image: String
  }],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String
  },
  paymentMethod: String,
  subtotal: Number,
  shippingFee: Number,
  total: Number,
  orderStatus: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: Number,
  comment: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);

async function setupSimple() {
  try {
    console.log('🔌 Kết nối MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    // Xóa toàn bộ
    console.log('🗑️  Xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({})
    ]);
    console.log('✅ Đã xóa sạch!\n');

    // Tạo users
    console.log('👥 Tạo users...');
    const hashedPass = await bcrypt.hash('admin123', 10);
    const hashedUser = await bcrypt.hash('user123', 10);
    
    const users = await User.insertMany([
      {
        username: 'admin',
        email: 'admin@kyp.com',
        password: hashedPass,
        fullname: 'Admin KYP',
        phone: '0123456789',
        role: 'admin'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: hashedUser,
        fullname: 'Nguyễn Văn A',
        phone: '0987654321',
        address: '123 Nguyễn Huệ, Q.1, TP.HCM',
        role: 'user'
      }
    ]);
    console.log(`✅ ${users.length} users`);

    // Tạo categories
    console.log('📦 Tạo categories...');
    const categories = await Category.insertMany([
      { name: 'Nhẫn', description: 'Nhẫn vàng, bạc, kim cương', image: '/img/nhan.webp' },
      { name: 'Dây chuyền', description: 'Dây chuyền cao cấp', image: '/img/day-chuyen.webp' },
      { name: 'Bông tai', description: 'Bông tai thời trang', image: '/img/bong-tai.jpg' },
      { name: 'Vòng tay', description: 'Vòng tay may mắn', image: '/img/lac-tay.webp' },
      { name: 'Lắc tay', description: 'Lắc tay cao cấp', image: '/img/lac-tay.webp' },
      { name: 'Mặt dây chuyền', description: 'Mặt dây chuyền đẹp', image: '/img/day-chuyen.webp' }
    ]);
    console.log(`✅ ${categories.length} categories`);

    // Tạo products
    console.log('💎 Tạo products...');
    const products = await Product.insertMany([
      {
        name: 'Nhẫn Kim Cương Vàng Trắng 18K',
        description: 'Nhẫn kim cương vàng trắng 18K cao cấp, thiết kế sang trọng',
        price: 25000000,
        salePrice: 22000000,
        category: categories[0]._id,
        images: ['/img/nhan.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 15,
        weight: 3.5,
        sold: 45,
        rating: 4.8
      },
      {
        name: 'Nhẫn Bạc Ý 925 Đính Đá',
        description: 'Nhẫn bạc Ý 925 đính đá CZ lấp lánh',
        price: 1500000,
        salePrice: 1200000,
        category: categories[0]._id,
        images: ['/img/nhan.webp'],
        material: 'silver',
        style: 'modern',
        stock: 30,
        weight: 2.8,
        sold: 120,
        rating: 4.5
      },
      {
        name: 'Dây Chuyền Vàng 24K Mặt Rồng',
        description: 'Dây chuyền vàng 24K nguyên chất với mặt rồng phong thủy',
        price: 35000000,
        salePrice: 33000000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'gold',
        style: 'classic',
        stock: 8,
        weight: 15.2,
        sold: 28,
        rating: 5.0
      },
      {
        name: 'Dây Chuyền Bạc Đính Ngọc Trai',
        description: 'Dây chuyền bạc cao cấp đính ngọc trai thiên nhiên',
        price: 2800000,
        salePrice: 2500000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 25,
        weight: 4.5,
        sold: 85,
        rating: 4.6
      },
      {
        name: 'Bông Tai Kim Cương Thiên Nhiên',
        description: 'Bông tai kim cương thiên nhiên chất lượng cao',
        price: 18000000,
        salePrice: 16500000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'gold',
        style: 'luxury',
        stock: 12,
        weight: 2.2,
        sold: 35,
        rating: 4.9
      },
      {
        name: 'Bông Tai Bạc Hình Bướm',
        description: 'Bông tai bạc hình bướm xinh xắn cho tuổi teen',
        price: 800000,
        salePrice: 650000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'silver',
        style: 'modern',
        stock: 40,
        weight: 1.5,
        sold: 156,
        rating: 4.4
      },
      {
        name: 'Vòng Tay Vàng 18K Phong Thủy',
        description: 'Vòng tay vàng 18K may mắn phong thủy tài lộc',
        price: 12000000,
        salePrice: 11000000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'classic',
        stock: 18,
        weight: 8.5,
        sold: 52,
        rating: 4.7
      },
      {
        name: 'Vòng Tay Charm Bạc',
        description: 'Vòng tay charm bạc có thể thay đổi charm theo sở thích',
        price: 1800000,
        salePrice: 1500000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'modern',
        stock: 35,
        weight: 3.2,
        sold: 98,
        rating: 4.5
      },
      {
        name: 'Lắc Tay Vàng Tây Ý',
        description: 'Lắc tay vàng tây 10K nhập khẩu Ý cao cấp',
        price: 8500000,
        salePrice: 7800000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 10,
        weight: 6.8,
        sold: 42,
        rating: 4.8
      },
      {
        name: 'Lắc Tay Bạc Nữ Dây Xích',
        description: 'Lắc tay bạc nữ thiết kế dây xích tinh tế',
        price: 950000,
        salePrice: 850000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 45,
        weight: 2.5,
        sold: 134,
        rating: 4.3
      },
      {
        name: 'Nhẫn Cưới Vàng Trắng',
        description: 'Nhẫn cưới vàng trắng 18K đính kim cương',
        price: 32000000,
        salePrice: 30000000,
        category: categories[0]._id,
        images: ['/img/nhan.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 6,
        weight: 4.2,
        sold: 15,
        rating: 5.0
      },
      {
        name: 'Dây Chuyền Bạc Nam',
        description: 'Dây chuyền bạc nam mạnh mẽ với mặt chữ thập',
        price: 1200000,
        salePrice: 1000000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'silver',
        style: 'modern',
        stock: 28,
        weight: 5.5,
        sold: 67,
        rating: 4.4
      },
      {
        name: 'Bông Tai Vàng Hình Trái Tim',
        description: 'Bông tai vàng tây 10K hình trái tim đáng yêu',
        price: 3500000,
        salePrice: 3200000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'gold',
        style: 'modern',
        stock: 20,
        weight: 1.8,
        sold: 78,
        rating: 4.6
      },
      {
        name: 'Vòng Tay Charm Vintage',
        description: 'Vòng tay charm phong cách vintage độc đáo',
        price: 2200000,
        salePrice: 1900000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'vintage',
        stock: 15,
        weight: 4.0,
        sold: 45,
        rating: 4.7
      },
      {
        name: 'Lắc Tay Trẻ Em Vàng',
        description: 'Lắc tay trẻ em vàng 24K nguyên chất may mắn',
        price: 4500000,
        salePrice: 4200000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'classic',
        stock: 22,
        weight: 2.0,
        sold: 89,
        rating: 4.9
      }
    ]);
    console.log(`✅ ${products.length} products`);

    // Tạo cart
    console.log('🛒 Tạo cart...');
    await Cart.create({
      user: users[1]._id,
      items: [
        { product: products[1]._id, qty: 2 },
        { product: products[4]._id, qty: 1 }
      ]
    });
    console.log('✅ Cart với 2 items');

    // Tạo wishlist
    console.log('❤️  Tạo wishlist...');
    await Wishlist.insertMany([
      { user: users[1]._id, product: products[0]._id },
      { user: users[1]._id, product: products[3]._id },
      { user: users[1]._id, product: products[6]._id }
    ]);
    console.log('✅ 3 wishlist items');

    // Tạo orders
    console.log('📦 Tạo orders...');
    await Order.insertMany([
      {
        user: users[1]._id,
        orderNumber: 'ORD' + Date.now(),
        items: [{
          product: products[1]._id,
          name: products[1].name,
          price: products[1].salePrice,
          qty: 1,
          image: products[1].images[0]
        }],
        shippingAddress: {
          fullName: users[1].fullname,
          phone: users[1].phone,
          address: users[1].address,
          city: 'TP.HCM',
          district: 'Q.1'
        },
        paymentMethod: 'COD',
        subtotal: products[1].salePrice,
        shippingFee: 30000,
        total: products[1].salePrice + 30000,
        orderStatus: 'delivered',
        paymentStatus: 'paid'
      }
    ]);
    console.log('✅ 1 order');

    // Tạo reviews
    console.log('⭐ Tạo reviews...');
    await Review.insertMany([
      {
        user: users[1]._id,
        product: products[1]._id,
        rating: 5,
        comment: 'Sản phẩm rất đẹp, đúng như mô tả!'
      }
    ]);
    console.log('✅ 1 review');

    console.log('\n═══════════════════════════════════');
    console.log('🎉 SETUP HOÀN TẤT!');
    console.log('═══════════════════════════════════');
    console.log('👥 Users: 2');
    console.log('📦 Categories: 6');
    console.log('💎 Products: 15');
    console.log('🛒 Cart: 2 items');
    console.log('❤️  Wishlist: 3 items');
    console.log('📦 Orders: 1');
    console.log('⭐ Reviews: 1');
    console.log('═══════════════════════════════════');
    console.log('\n📧 Test accounts:');
    console.log('   Admin: admin@kyp.com / admin123');
    console.log('   User:  user@example.com / user123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

setupSimple();
