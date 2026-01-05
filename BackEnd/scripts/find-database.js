require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabaseInfo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối thành công\n');
    
    // Lấy thông tin database đang dùng
    const dbName = mongoose.connection.db.databaseName;
    console.log('📂 Database đang dùng:', dbName);
    console.log('🔗 Connection URI:', process.env.MONGO_URI);
    
    // List tất cả collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 Collections trong database "${dbName}":`);
    
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} documents`);
    }
    
    // Kiểm tra products collection cụ thể
    const productsCount = await mongoose.connection.db.collection('products').countDocuments();
    console.log(`\n📦 Tổng số sản phẩm: ${productsCount}`);
    
    if (productsCount > 0) {
      console.log('\n✅ DATA CÓ TRONG DATABASE!');
      console.log(`\n💡 CÁCH XEM TRONG MONGODB COMPASS:`);
      console.log(`   1. Mở MongoDB Compass`);
      console.log(`   2. Connect với URI: ${process.env.MONGO_URI}`);
      console.log(`   3. Tìm database: "${dbName}"`);
      console.log(`   4. Mở collection: "products"`);
      console.log(`   5. Bạn sẽ thấy ${productsCount} sản phẩm`);
    } else {
      console.log('\n⚠️  Collection products trống!');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkDatabaseInfo();
