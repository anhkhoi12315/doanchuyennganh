require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function setFeaturedProducts() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    const db = mongoose.connection.db;
    
    // Check current featured products
    const featuredCount = await db.collection('products').countDocuments({ isFeatured: true });
    console.log(`📊 Featured products hiện tại: ${featuredCount}\n`);
    
    // Get top 8 products by sold
    const topProducts = await db.collection('products')
      .find({ isActive: true })
      .sort({ sold: -1 })
      .limit(8)
      .toArray();
    
    console.log('⭐ Set 8 products làm featured...');
    
    // Update products to be featured
    for (const product of topProducts) {
      await db.collection('products').updateOne(
        { _id: product._id },
        { $set: { isFeatured: true } }
      );
      console.log(`   ✅ ${product.name} - sold: ${product.sold}`);
    }
    
    const newFeaturedCount = await db.collection('products').countDocuments({ isFeatured: true });
    console.log(`\n✅ Đã có ${newFeaturedCount} featured products!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

setFeaturedProducts();
