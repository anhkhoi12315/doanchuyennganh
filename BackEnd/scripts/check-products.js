require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công\n');
    
    const products = await Product.find();
    console.log(`📦 Tổng số sản phẩm trong Database: ${products.length}\n`);
    
    if (products.length === 0) {
      console.log('⚠️  Database TRỐNG - Chưa có sản phẩm nào!');
      console.log('\n💡 Giải pháp:');
      console.log('   - Chạy: npm run seed (để seed dữ liệu mẫu)');
      console.log('   - Hoặc thêm sản phẩm từ trang admin');
    } else {
      console.log('📋 Danh sách sản phẩm:\n');
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   - ID: ${p._id}`);
        console.log(`   - Giá: ${p.price?.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   - Danh mục: ${p.category || 'N/A'}`);
        console.log(`   - Stock: ${p.stock || 0}`);
        console.log('');
      });
    }
    
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkProducts();
