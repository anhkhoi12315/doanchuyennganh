require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function forceClean() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    const db = mongoose.connection.db;
    
    // Lấy tất cả collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Tìm thấy ${collections.length} collections\n`);

    // Xóa từng collection
    for (const collection of collections) {
      const collName = collection.name;
      console.log(`🗑️  Đang xử lý: ${collName}`);
      
      try {
        // Drop all indexes trước
        const indexes = await db.collection(collName).indexes();
        for (const index of indexes) {
          if (index.name !== '_id_') { // Giữ lại _id index
            try {
              await db.collection(collName).dropIndex(index.name);
              console.log(`   ✅ Xóa index: ${index.name}`);
            } catch (e) {
              console.log(`   ⚠️  Không xóa được index ${index.name}: ${e.message}`);
            }
          }
        }
        
        // Drop collection
        await db.collection(collName).drop();
        console.log(`   ✅ Đã xóa collection\n`);
      } catch (e) {
        console.log(`   ⚠️  Lỗi: ${e.message}\n`);
      }
    }

    console.log('═══════════════════════════════════');
    console.log('✅ HOÀN TẤT! Database đã sạch hoàn toàn');
    console.log('═══════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

forceClean();
