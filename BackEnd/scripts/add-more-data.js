require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Simple schemas
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
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const supportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  category: String,
  status: { type: String, default: 'new' },
  priority: { type: String, default: 'medium' },
  responses: [{
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: Date
  }]
}, { timestamps: true });

const userBehaviorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  eventType: String,
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  searchQuery: String,
  metadata: mongoose.Schema.Types.Mixed,
  userAgent: String,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
});

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  userInput: {
    age: Number,
    gender: String,
    occasion: String,
    style: [String],
    priceRange: { min: Number, max: Number },
    material: [String],
    recipient: String
  },
  recommendedProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    score: Number,
    reason: String
  }],
  clicked: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    timestamp: Date
  }],
  purchased: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    timestamp: Date
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Support = mongoose.model('Support', supportSchema);
const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);
const Recommendation = mongoose.model('Recommendation', recommendationSchema);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

async function addMoreData() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    // Lấy existing data
    const users = await User.find();
    const categories = await Category.find();
    const products = await Product.find();
    
    console.log(`📊 Hiện có: ${users.length} users, ${categories.length} categories, ${products.length} products\n`);

    // THÊM 15 PRODUCTS NỮA
    console.log('💎 Thêm 15 products...');
    const newProducts = await Product.insertMany([
      // Nhẫn thêm 2 cái (hiện có 8)
      {
        name: 'Nhẫn Ruby Đỏ',
        description: 'Nhẫn đá ruby đỏ thiên nhiên đính vàng',
        price: 28000000,
        category: categories[0]._id,
        images: ['/img/nhan9.webp'],
        material: 'gemstone',
        style: 'luxury',
        stock: 7,
        weight: 5.8,
        sold: 12,
        rating: 4.9,
        reviewCount: 6
      },
      {
        name: 'Nhẫn Sapphire Xanh',
        description: 'Nhẫn đá sapphire xanh cao cấp',
        price: 35000000,
        category: categories[0]._id,
        images: ['/img/nhan10.webp'],
        material: 'gemstone',
        style: 'luxury',
        stock: 4,
        weight: 6.2,
        sold: 8,
        rating: 5.0,
        reviewCount: 4
      },

      // Dây chuyền thêm 3 cái (hiện có 7)
      {
        name: 'Dây Chuyền Bạc Layered',
        description: 'Dây chuyền bạc nhiều tầng trendy',
        price: 720000,
        category: categories[1]._id,
        images: ['/img/daychuyen8.webp'],
        material: 'silver',
        style: 'modern',
        stock: 45,
        weight: 11.0,
        sold: 68,
        rating: 4.6,
        reviewCount: 34
      },
      {
        name: 'Dây Chuyền Mix Kim Loại',
        description: 'Dây chuyền phối nhiều kim loại',
        price: 980000,
        salePrice: 850000,
        category: categories[1]._id,
        images: ['/img/daychuyen9.webp'],
        material: 'mixed',
        style: 'modern',
        stock: 30,
        weight: 9.0,
        sold: 52,
        rating: 4.4,
        reviewCount: 26
      },
      {
        name: 'Dây Chuyền Vàng Y',
        description: 'Dây chuyền vàng kiểu chữ Y',
        price: 16000000,
        category: categories[1]._id,
        images: ['/img/daychuyen10.webp'],
        material: 'gold',
        style: 'modern',
        stock: 8,
        weight: 8.5,
        sold: 18,
        rating: 4.7,
        reviewCount: 9
      },

      // Bông tai thêm 3 cái (hiện có 5)
      {
        name: 'Bông Tai Hoa Tai',
        description: 'Bông tai hoa tai bạc xinh xắn',
        price: 380000,
        category: categories[2]._id,
        images: ['/img/bongtai6.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 90,
        weight: 1.8,
        sold: 210,
        rating: 4.5,
        reviewCount: 105
      },
      {
        name: 'Bông Tai Đính Đá Màu',
        description: 'Bông tai bạc đính đá nhiều màu sắc',
        price: 650000,
        category: categories[2]._id,
        images: ['/img/bongtai7.webp'],
        material: 'silver',
        style: 'modern',
        stock: 38,
        weight: 3.5,
        sold: 75,
        rating: 4.6,
        reviewCount: 38
      },
      {
        name: 'Bông Tai Vàng Tây Dài',
        description: 'Bông tai vàng tây dài sang trọng',
        price: 8500000,
        category: categories[2]._id,
        images: ['/img/bongtai8.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 10,
        weight: 7.2,
        sold: 15,
        rating: 4.8,
        reviewCount: 8
      },

      // Vòng tay thêm 3 cái (hiện có 5)
      {
        name: 'Vòng Tay Bạc Đan',
        description: 'Vòng tay bạc kiểu đan chéo',
        price: 850000,
        category: categories[3]._id,
        images: ['/img/vongtay6.webp'],
        material: 'silver',
        style: 'modern',
        stock: 42,
        weight: 13.5,
        sold: 88,
        rating: 4.5,
        reviewCount: 44
      },
      {
        name: 'Vòng Tay Vàng Trơn',
        description: 'Vòng tay vàng 18K trơn bóng',
        price: 28000000,
        category: categories[3]._id,
        images: ['/img/vongtay7.webp'],
        material: 'gold',
        style: 'classic',
        stock: 6,
        weight: 22.0,
        sold: 10,
        rating: 5.0,
        reviewCount: 5
      },
      {
        name: 'Vòng Tay Mix Gold Silver',
        description: 'Vòng tay phối vàng bạc 2 tông màu',
        price: 1200000,
        category: categories[3]._id,
        images: ['/img/vongtay8.webp'],
        material: 'mixed',
        style: 'modern',
        stock: 28,
        weight: 11.0,
        sold: 56,
        rating: 4.4,
        reviewCount: 28
      },

      // Lắc tay thêm 2 cái (hiện có 3)
      {
        name: 'Lắc Tay Bạc Charm Trái Tim',
        description: 'Lắc tay bạc đính charm trái tim',
        price: 720000,
        category: categories[4]._id,
        images: ['/img/lactay4.webp'],
        material: 'silver',
        style: 'modern',
        stock: 55,
        weight: 9.5,
        sold: 102,
        rating: 4.7,
        reviewCount: 51
      },
      {
        name: 'Lắc Tay Vàng Đính Đá',
        description: 'Lắc tay vàng 14K đính đá CZ',
        price: 18000000,
        category: categories[4]._id,
        images: ['/img/lactay5.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 7,
        weight: 16.0,
        sold: 12,
        rating: 4.9,
        reviewCount: 6
      },

      // Mặt dây chuyền thêm 2 cái (hiện có 2)
      {
        name: 'Mặt Dây Infinity',
        description: 'Mặt dây bạc hình vô cực',
        price: 380000,
        category: categories[5]._id,
        images: ['/img/matdaychuyen3.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 75,
        weight: 2.8,
        sold: 140,
        rating: 4.6,
        reviewCount: 70
      },
      {
        name: 'Mặt Dây Chữ Thập',
        description: 'Mặt dây chữ thập vàng 10K',
        price: 4500000,
        category: categories[5]._id,
        images: ['/img/matdaychuyen4.webp'],
        material: 'gold',
        style: 'classic',
        stock: 15,
        weight: 4.2,
        sold: 28,
        rating: 4.8,
        reviewCount: 14
      }
    ]);
    console.log(`✅ Thêm ${newProducts.length} products\n`);

    // LẤY TẤT CẢ PRODUCTS ĐỂ TẠO DATA
    const allProducts = await Product.find();

    // TẠO SUPPORT TICKETS
    console.log('📧 Tạo support tickets...');
    const supports = await Support.insertMany([
      {
        user: users[1]._id,
        name: users[1].fullname || 'Nguyễn Văn A',
        email: users[1].email,
        phone: users[1].phone || '0987654321',
        subject: 'Hỏi về bảo hành sản phẩm',
        message: 'Cho em hỏi sản phẩm nhẫn kim cương có chế độ bảo hành như thế nào ạ?',
        category: 'product',
        status: 'resolved',
        priority: 'medium',
        responses: [{
          admin: users[0]._id,
          message: 'Tất cả sản phẩm đều được bảo hành 12 tháng và miễn phí bảo dưỡng trọn đời.',
          timestamp: new Date(Date.now() - 3600000)
        }]
      },
      {
        user: users[1]._id,
        name: users[1].fullname || 'Nguyễn Văn A',
        email: users[1].email,
        phone: users[1].phone || '0987654321',
        subject: 'Kiểm tra đơn hàng',
        message: 'Đơn hàng của em đang ở trạng thái nào rồi ạ?',
        category: 'order',
        status: 'in-progress',
        priority: 'high'
      },
      {
        name: 'Trần Thị Bình',
        email: 'customer1@gmail.com',
        phone: '0909123456',
        subject: 'Đổi size nhẫn',
        message: 'Em muốn đổi size nhẫn vì bị rộng, có được không ạ?',
        category: 'return',
        status: 'new',
        priority: 'medium'
      },
      {
        name: 'Lê Văn Cường',
        email: 'customer2@gmail.com',
        phone: '0908765432',
        subject: 'Tư vấn mua quà',
        message: 'Em muốn mua quà tặng bạn gái, nên chọn sản phẩm nào ạ?',
        category: 'other',
        status: 'new',
        priority: 'low'
      }
    ]);
    console.log(`✅ ${supports.length} support tickets\n`);

    // TẠO USER BEHAVIORS
    console.log('📊 Tạo user behaviors...');
    const behaviors = await UserBehavior.insertMany([
      // User 1 behaviors
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_1',
        eventType: 'view',
        product: allProducts[0]._id,
        category: categories[0]._id,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 86400000)
      },
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_1',
        eventType: 'add_to_cart',
        product: allProducts[0]._id,
        category: categories[0]._id,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 86300000)
      },
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_2',
        eventType: 'search',
        searchQuery: 'nhẫn kim cương',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 43200000)
      },
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_2',
        eventType: 'view',
        product: allProducts[8]._id,
        category: categories[1]._id,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 43100000)
      },
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_3',
        eventType: 'wishlist',
        product: allProducts[15]._id,
        category: categories[2]._id,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 21600000)
      },
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_4',
        eventType: 'purchase',
        product: allProducts[1]._id,
        category: categories[0]._id,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 10800000)
      },
      // More behaviors
      {
        eventType: 'view',
        product: allProducts[10]._id,
        category: categories[1]._id,
        sessionId: 'guest_' + Date.now(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        ipAddress: '192.168.1.150',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        eventType: 'search',
        searchQuery: 'dây chuyền bạc',
        sessionId: 'guest_' + Date.now(),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        ipAddress: '192.168.1.200',
        timestamp: new Date(Date.now() - 3600000)
      }
    ]);
    console.log(`✅ ${behaviors.length} user behaviors\n`);

    // TẠO RECOMMENDATIONS
    console.log('🎯 Tạo recommendations...');
    const recommendations = await Recommendation.insertMany([
      {
        user: users[1]._id,
        sessionId: 'sess_' + Date.now() + '_1',
        userInput: {
          age: 28,
          gender: 'female',
          occasion: 'gift',
          style: ['modern', 'minimalist'],
          priceRange: { min: 500000, max: 5000000 },
          material: ['silver', 'gold'],
          recipient: 'self'
        },
        recommendedProducts: [
          { product: allProducts[1]._id, score: 0.95, reason: 'Phù hợp phong cách hiện đại và ngân sách' },
          { product: allProducts[4]._id, score: 0.88, reason: 'Thiết kế tối giản, giá phải chăng' },
          { product: allProducts[9]._id, score: 0.82, reason: 'Dây chuyền bạc sang trọng' },
          { product: allProducts[17]._id, score: 0.78, reason: 'Bông tai bạc phù hợp với phong cách' }
        ],
        clicked: [
          { product: allProducts[1]._id, timestamp: new Date(Date.now() - 7200000) },
          { product: allProducts[4]._id, timestamp: new Date(Date.now() - 6000000) }
        ],
        purchased: [
          { product: allProducts[1]._id, timestamp: new Date(Date.now() - 3600000) }
        ]
      },
      {
        user: users[0]._id,
        sessionId: 'sess_' + Date.now() + '_2',
        userInput: {
          age: 35,
          gender: 'male',
          occasion: 'wedding',
          style: ['luxury', 'classic'],
          priceRange: { min: 10000000, max: 50000000 },
          material: ['diamond', 'gold'],
          recipient: 'partner'
        },
        recommendedProducts: [
          { product: allProducts[0]._id, score: 0.97, reason: 'Nhẫn kim cương cho dịp đặc biệt' },
          { product: allProducts[2]._id, score: 0.93, reason: 'Nhẫn cưới vàng trắng cao cấp' },
          { product: allProducts[8]._id, score: 0.89, reason: 'Dây chuyền vàng sang trọng' },
          { product: allProducts[15]._id, score: 0.85, reason: 'Bông tai kim cương lộng lẫy' }
        ]
      },
      {
        sessionId: 'guest_' + Date.now(),
        userInput: {
          age: 25,
          gender: 'female',
          occasion: 'birthday',
          style: ['modern'],
          priceRange: { min: 300000, max: 1000000 },
          material: ['silver'],
          recipient: 'self'
        },
        recommendedProducts: [
          { product: allProducts[4]._id, score: 0.92, reason: 'Nhẫn bạc minimalist đẹp' },
          { product: allProducts[11]._id, score: 0.88, reason: 'Dây chuyền bạc simple' },
          { product: allProducts[16]._id, score: 0.85, reason: 'Bông tai bạc mini xinh' }
        ]
      }
    ]);
    console.log(`✅ ${recommendations.length} recommendations\n`);

    // FINAL STATS
    const finalProducts = await Product.countDocuments();
    const finalSupports = await Support.countDocuments();
    const finalBehaviors = await UserBehavior.countDocuments();
    const finalRecommendations = await Recommendation.countDocuments();

    console.log('═══════════════════════════════════');
    console.log('🎉 ĐÃ BỔ SUNG DỮ LIỆU ĐẦY ĐỦ!');
    console.log('═══════════════════════════════════');
    console.log(`💎 Products: ${finalProducts} (đã có đủ chức năng)`);
    console.log(`📧 Support Tickets: ${finalSupports}`);
    console.log(`📊 User Behaviors: ${finalBehaviors}`);
    console.log(`🎯 Recommendations: ${finalRecommendations}`);
    console.log('═══════════════════════════════════\n');

    console.log('✅ Tất cả chức năng đã được tạo dữ liệu:');
    console.log('   ✓ Users & Authentication');
    console.log('   ✓ Products & Categories');
    console.log('   ✓ Cart & Wishlist');
    console.log('   ✓ Orders & Reviews');
    console.log('   ✓ Support Tickets');
    console.log('   ✓ User Behavior Tracking');
    console.log('   ✓ AI Recommendations');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

addMoreData();
