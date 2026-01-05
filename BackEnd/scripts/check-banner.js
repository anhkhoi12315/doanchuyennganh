const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('../models/Banner');
const Product = require('../models/Product'); // Cần import Product model

dotenv.config();

async function checkBanner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const banners = await Banner.find().populate('productIds');
    
    console.log('\n📊 Total banners:', banners.length);
    
    banners.forEach((banner, index) => {
      console.log(`\n🎯 Banner ${index + 1}:`);
      console.log('   Title:', banner.title);
      console.log('   Active:', banner.isActive);
      console.log('   Products:', banner.productIds.length);
      
      if (banner.productIds.length > 0) {
        banner.productIds.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - ${(p.salePrice || p.price).toLocaleString('vi-VN')} VNĐ`);
        });
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBanner();
