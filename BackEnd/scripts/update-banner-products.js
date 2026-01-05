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

async function updateBannerWithProducts() {
  try {
    await connectDB();

    // Get 2 random sale products
    const products = await Product.find({ 
      salePrice: { $exists: true, $ne: null, $gt: 0 } 
    }).limit(2);

    if (products.length < 2) {
      console.log('⚠️  Not enough sale products. Getting any 2 products...');
      const allProducts = await Product.find().limit(2);
      
      if (allProducts.length < 2) {
        console.log('❌ Not enough products in database');
        process.exit(1);
      }
      
      products.length = 0;
      products.push(...allProducts);
    }

    console.log('📦 Selected products:');
    products.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.salePrice ? `${p.salePrice.toLocaleString('vi-VN')}` : p.price.toLocaleString('vi-VN')} VNĐ`);
    });

    // Find existing banner
    let banner = await Banner.findOne();

    if (!banner) {
      // Create new banner
      banner = new Banner({
        title: '🎉 KHUYẾN MÃI ĐẶC BIỆT',
        message: 'Giảm giá lên đến 50% cho các sản phẩm trang sức cao cấp. Nhanh tay đặt hàng!',
        type: 'sale',
        discount: 50,
        productIds: products.map(p => p._id),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: 1,
        isActive: true
      });
      await banner.save();
      console.log('✅ Created new banner with 2 products');
    } else {
      // Update existing banner
      banner.productIds = products.map(p => p._id);
      banner.isActive = true;
      await banner.save();
      console.log('✅ Updated existing banner with 2 products');
    }

    console.log('📊 Banner info:');
    console.log('   - Title:', banner.title);
    console.log('   - Products:', banner.productIds.length);
    console.log('   - Status:', banner.isActive ? 'Active' : 'Inactive');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateBannerWithProducts();
