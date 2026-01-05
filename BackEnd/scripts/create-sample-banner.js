const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('../models/Banner');
const Product = require('../models/Product');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function createSampleBanner() {
  try {
    await connectDB();

    // Get some sale products
    const saleProducts = await Product.find({ 
      salePrice: { $exists: true, $ne: null, $gt: 0 } 
    }).limit(4);

    if (saleProducts.length === 0) {
      console.log('⚠️  No sale products found. Creating banner without products...');
    }

    // Delete old banners
    await Banner.deleteMany({});
    console.log('🗑️  Deleted old banners');

    // Create new banner
    const banner = new Banner({
      title: '🎉 KHUYẾN MÃI ĐẶC BIỆT - SALE LỚN',
      message: 'Giảm giá lên đến 50% cho các sản phẩm trang sức cao cấp. Nhanh tay đặt hàng!',
      type: 'sale',
      discount: 50,
      productIds: saleProducts.map(p => p._id),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: 1,
      isActive: true
    });

    await banner.save();
    console.log('✅ Banner created successfully!');
    console.log('📊 Banner info:');
    console.log('   - Title:', banner.title);
    console.log('   - Products:', saleProducts.length);
    console.log('   - End date:', banner.endDate.toLocaleDateString('vi-VN'));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSampleBanner();
