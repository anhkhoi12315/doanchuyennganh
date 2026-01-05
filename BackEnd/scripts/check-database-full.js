require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkDatabase() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('═══════════════════════════════════');
    console.log(`📚 DATABASE: test`);
    console.log('═══════════════════════════════════\n');

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`✓ ${collection.name.padEnd(20)} : ${count} documents`);
    }

    console.log('\n═══════════════════════════════════');
    console.log('📋 CHI TIẾT:');
    console.log('═══════════════════════════════════');
    
    const users = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
    console.log(`\n👥 USERS (${users.length}):`);
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`));

    const categories = await db.collection('categories').find({}, { projection: { name: 1 } }).toArray();
    console.log(`\n📦 CATEGORIES (${categories.length}):`);
    categories.forEach(c => console.log(`   - ${c.name}`));

    const products = await db.collection('products').find({}, { projection: { name: 1, price: 1, category: 1 } }).limit(10).toArray();
    console.log(`\n💎 PRODUCTS (${await db.collection('products').countDocuments()}) - Showing first 10:`);
    products.forEach(p => console.log(`   - ${p.name.substring(0, 40)} - ${p.price.toLocaleString()} VND`));

    const supports = await db.collection('supports').find({}, { projection: { subject: 1, status: 1 } }).toArray();
    console.log(`\n📧 SUPPORT TICKETS (${supports.length}):`);
    supports.forEach(s => console.log(`   - ${s.subject} [${s.status}]`));

    const behaviors = await db.collection('userbehaviors').find({}, { projection: { eventType: 1 } }).toArray();
    console.log(`\n📊 USER BEHAVIORS (${behaviors.length}):`);
    const behaviorCounts = {};
    behaviors.forEach(b => {
      behaviorCounts[b.eventType] = (behaviorCounts[b.eventType] || 0) + 1;
    });
    Object.keys(behaviorCounts).forEach(type => {
      console.log(`   - ${type}: ${behaviorCounts[type]}`);
    });

    const recommendations = await db.collection('recommendations').countDocuments();
    console.log(`\n🎯 RECOMMENDATIONS: ${recommendations}`);

    const carts = await db.collection('carts').countDocuments();
    console.log(`🛒 CARTS: ${carts}`);

    const wishlists = await db.collection('wishlists').countDocuments();
    console.log(`❤️  WISHLISTS: ${wishlists}`);

    const orders = await db.collection('orders').countDocuments();
    console.log(`📦 ORDERS: ${orders}`);

    const reviews = await db.collection('reviews').countDocuments();
    console.log(`⭐ REVIEWS: ${reviews}`);

    console.log('\n═══════════════════════════════════');
    console.log('✅ DATABASE TEST ĐÃ ĐẦY ĐỦ!');
    console.log('═══════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkDatabase();
