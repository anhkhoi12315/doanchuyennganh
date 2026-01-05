require('dotenv').config();
const mongoose = require('mongoose');

async function checkAllDatabases() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối thành công\n');
    
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // List tất cả databases
    const { databases } = await adminDb.listDatabases();
    
    console.log('📂 TẤT CẢ DATABASES:\n');
    
    for (const database of databases) {
      console.log(`\n🗄️  Database: ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // Connect to this database
      const thisDb = mongoose.connection.client.db(database.name);
      const collections = await thisDb.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('   └─ (trống)');
      } else {
        for (const coll of collections) {
          const count = await thisDb.collection(coll.name).countDocuments();
          console.log(`   ├─ ${coll.name}: ${count} documents`);
        }
      }
    }
    
    console.log('\n📍 Database hiện tại đang dùng:', mongoose.connection.db.databaseName);
    console.log('🔗 Connection URI:', process.env.MONGO_URI);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkAllDatabases();
