require('dotenv').config();
const mongoose = require('mongoose');

async function showProductsDetail() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Query trực tiếp từ collection
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    console.log('🔍 Kiểm tra collection products chi tiết:\n');
    
    // Count
    const count = await productsCollection.countDocuments();
    console.log(`📊 Số lượng: ${count} documents\n`);
    
    if (count === 0) {
      console.log('⚠️  Collection thực sự trống!\n');
      
      // Kiểm tra xem có collection nào khác chứa products không
      const allCollections = await db.listCollections().toArray();
      console.log('📋 Tất cả collections:');
      for (const coll of allCollections) {
        const c = await db.collection(coll.name).countDocuments();
        console.log(`   - ${coll.name}: ${c} docs`);
      }
    } else {
      console.log('📦 Danh sách sản phẩm:\n');
      
      const products = await productsCollection.find({}).toArray();
      
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name || 'No name'}`);
        console.log(`   _id: ${p._id}`);
        console.log(`   price: ${p.price || 0}`);
        console.log(`   category: ${p.category || 'N/A'}`);
        console.log('');
      });
      
      // Export to JSON file
      const fs = require('fs');
      const outputPath = './products_export.json';
      fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
      console.log(`\n💾 Đã export data ra file: ${outputPath}`);
      console.log('   Bạn có thể mở file này để xem data\n');
    }
    
    console.log('💡 CÁCH FIX TRONG COMPASS:');
    console.log('   1. Click nút "Reload Data" (⟳) ở góc phải');
    console.log('   2. Hoặc disconnect và reconnect lại');
    console.log('   3. Đảm bảo không có filter nào đang active');
    console.log('   4. Thử click vào tab "Schema" rồi quay lại "Documents"');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

showProductsDetail();
