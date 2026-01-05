require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkProducts() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    const db = mongoose.connection.db;
    
    // Check products collection
    const productsCount = await db.collection('products').countDocuments();
    console.log(`📊 Tổng số products: ${productsCount}\n`);
    
    if (productsCount > 0) {
      console.log('📋 10 products đầu tiên:');
      const products = await db.collection('products').find({}).limit(10).toArray();
      
      products.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.name}`);
        console.log(`   ID: ${p._id}`);
        console.log(`   Price: ${p.price}`);
        console.log(`   Category: ${p.category}`);
        console.log(`   isActive: ${p.isActive}`);
        console.log(`   Images: ${p.images?.length || 0}`);
      });
      
      // Check active products
      const activeCount = await db.collection('products').countDocuments({ isActive: true });
      console.log(`\n✅ Products active: ${activeCount}/${productsCount}`);
      
      // Check if products have category reference
      const withCategory = await db.collection('products').countDocuments({ category: { $exists: true } });
      console.log(`🏷️  Products có category: ${withCategory}/${productsCount}`);
    } else {
      console.log('❌ KHÔNG CÓ PRODUCTS TRONG DATABASE!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkProducts();
