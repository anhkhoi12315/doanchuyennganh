require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function testProductCards() {
  try {
    console.log('\n=== TEST PRODUCT CARDS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Ket noi MongoDB');
    
    // Lấy sản phẩm
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name price salePrice category material slug images')
      .limit(5)
      .lean();
    
    console.log(`✓ Tim thay ${products.length} san pham\n`);
    
    // Tạo message test
    const userMessage = "Tôi muốn mua nhẫn bạc giá khoảng 1-2 triệu";
    const aiResponse = `Chào bạn! Shop có mấy mẫu nhẫn bạc trong tầm giá này đây ạ:

💎 Nhẫn Bạc Ý 925 Đính Đá
• Giá: 1.200.000đ
• Loại: Nhẫn bạc
• Đặc điểm: Thiết kế tinh tế, phù hợp mọi dịp

💎 Lắc Tay Bạc Nữ Dây Xích  
• Giá: 850.000đ
• Loại: Lắc tay bạc
• Đặc điểm: Kiểu dáng thanh lịch

Bạn thích mẫu nào hơn ạ? 😊`;

    console.log('AI Response:');
    console.log(aiResponse);
    console.log('\n--- Tim san pham duoc de cap ---\n');
    
    // Tìm sản phẩm được đề cập
    const mentionedProducts = [];
    for (const product of products) {
      if (aiResponse.includes(product.name)) {
        console.log(`✓ Tim thay: ${product.name}`);
        mentionedProducts.push({
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.salePrice || product.price,
          originalPrice: product.price,
          image: product.images[0] || '/img/default-product.jpg',
          category: product.category?.name
        });
      }
    }
    
    console.log(`\nTong: ${mentionedProducts.length} san pham\n`);
    
    if (mentionedProducts.length > 0) {
      console.log('DANH SACH SAN PHAM TRA VE:\n');
      mentionedProducts.forEach(p => {
        console.log(`- ${p.name}`);
        console.log(`  Gia: ${p.price.toLocaleString('vi-VN')}d`);
        console.log(`  Slug: ${p.slug}`);
        console.log(`  Link: sanpham.html?slug=${p.slug}\n`);
      });
    }
    
    mongoose.connection.close();
    console.log('✓ Hoan thanh!\n');
    
  } catch (error) {
    console.error('\nX LOI:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testProductCards();
