// Check user role
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkUserRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find().select('username email fullname role');
    
    console.log('\n👥 Users in database:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.fullname || user.username}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role} ${user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    const adminCount = users.filter(u => u.role === 'admin').length;
    console.log(`\n📊 Summary: ${users.length} users, ${adminCount} admins`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserRole();
