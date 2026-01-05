// Script để drop indexes và setup lại database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function dropIndexesAndSetup() {
  try {
    console.log('🔌 Kết nối MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    const db = mongoose.connection.db;
    
    // Drop tất cả indexes có vấn đề
    console.log('🗑️  Dropping problematic indexes...');
    try {
      await db.collection('users').dropIndex('gender_1');
      console.log('✅ Dropped gender_1 index');
    } catch (e) {
      console.log('⚠️  gender_1 index không tồn tại');
    }

    // Drop toàn bộ collections
    console.log('\n🗑️  Dropping all collections...');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`✅ Dropped ${collection.name}`);
    }

    console.log('\n✅ Database đã sạch sẽ!');
    console.log('📝 Bây giờ chạy: node scripts/setup-full-database.js\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

dropIndexesAndSetup();
