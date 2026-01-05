require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function testChatbotDB() {
  try {
    console.log('\n=== TEST LAY SAN PHAM TU DATABASE ===\n');
    
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Ket noi MongoDB thanh cong');
    
    // Lấy sản phẩm
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name price salePrice category material style stock')
      .limit(10)
      .lean();
    
    console.log(`✓ Tim thay ${products.length} san pham\n`);
    
    // Hiển thị sản phẩm
    console.log('DANH SACH SAN PHAM:\n');
    products.forEach((p, index) => {
      const finalPrice = p.salePrice || p.price;
      const priceStr = finalPrice.toLocaleString('vi-VN');
      const categoryName = p.category?.name || 'Chua phan loai';
      console.log(`${index + 1}. ${p.name}`);
      console.log(`   Gia: ${priceStr}d`);
      console.log(`   Loai: ${categoryName}`);
      console.log(`   Chat lieu: ${p.material}`);
      console.log(`   Phong cach: ${p.style}`);
      console.log(`   Kho: ${p.stock}\n`);
    });
    
    mongoose.connection.close();
    console.log('✓ Hoan thanh!\n');
    
  } catch (error) {
    console.error('X Loi:', error.message);
    process.exit(1);
  }
}

testChatbotDB();
