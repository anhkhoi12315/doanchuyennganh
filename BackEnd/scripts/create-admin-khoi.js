require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  fullName: String,
  phone: String,
  role: String,
  isActive: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminKhoi() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    // Check if user exists
    const existingUser = await User.findOne({ email: 'khoi' });
    
    if (existingUser) {
      console.log('⚠️  User "khoi" đã tồn tại!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Active: ${existingUser.isActive}`);
      
      // Update password and role
      console.log('\n🔄 Cập nhật password và role...');
      const hashedPassword = await bcrypt.hash('1', 10);
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      await existingUser.save();
      console.log('✅ Đã cập nhật thành công!');
    } else {
      // Create new user
      console.log('👤 Tạo user mới "khoi"...');
      const hashedPassword = await bcrypt.hash('1', 10);
      
      const newUser = await User.create({
        email: 'khoi',
        password: hashedPassword,
        fullName: 'Admin Khôi',
        phone: '0123456789',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Tạo thành công!');
      console.log(`   ID: ${newUser._id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('\n═══════════════════════════════════');
    console.log('✅ HOÀN TẤT!');
    console.log('═══════════════════════════════════');
    console.log('📧 Login với:');
    console.log('   Email: khoi');
    console.log('   Password: 1');
    console.log('   Role: admin');
    console.log('═══════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

createAdminKhoi();
