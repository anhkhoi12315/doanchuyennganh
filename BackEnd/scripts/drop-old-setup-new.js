// Drop old bantrangsuc database and setup new 'test' database
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldAndSetupNew() {
  try {
    // Connect to OLD database to drop it
    console.log('🔌 Kết nối database CŨ (bantrangsuc) để xóa...');
    await mongoose.connect('mongodb+srv://khoi:12345@quochung.e6kffux.mongodb.net/bantrangsuc?retryWrites=true&w=majority');
    console.log('✅ Đã kết nối bantrangsuc');
    
    // Xóa tất cả collections trong bantrangsuc
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`🗑️  Xóa ${collections.length} collections...`);
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`   ✅ Đã xóa ${collection.name}`);
    }
    console.log('✅ Đã XÓA SẠCH toàn bộ dữ liệu trong "bantrangsuc"\n');
    
    await mongoose.disconnect();
    
    // Connect to NEW database
    console.log('🔌 Kết nối database MỚI (test)...');
    const NEW_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('📍 URI:', NEW_URI.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(NEW_URI);
    console.log('✅ Đã kết nối database "test"\n');
    
    console.log('✅ Hoàn tất! Database đã đổi sang "test"');
    console.log('📝 Chạy: node scripts/setup-simple.js để tạo dữ liệu mới\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

dropOldAndSetupNew();
