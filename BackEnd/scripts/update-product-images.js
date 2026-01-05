require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Map ảnh theo danh mục - URL từ Unsplash (jewelry images)
const imageMap = {
  'Mặt dây chuyền': [
    ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500'],
    ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500'],
    ['https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500', 'https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500'],
    ['https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500']
  ],
  'Dây chuyền': [
    ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1599643478877-530eb83abc8e?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500'],
    ['https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500'],
    ['https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500', 'https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500'],
    ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500']
  ],
  'Lắc tay': [
    ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
    ['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 'https://images.unsplash.com/photo-1599643478877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500'],
    ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500'],
    ['https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500', 'https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500'],
    ['https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500']
  ],
  'Bông tai': [
    ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 'https://images.unsplash.com/photo-1599643478877-530eb83abc8e?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
    ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500'],
    ['https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500'],
    ['https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500']
  ],
  'Nhẫn': [
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500'],
    ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500'],
    ['https://images.unsplash.com/photo-1599643478877-530eb83abc8e?w=500', 'https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500']
  ],
  'Vòng tay': [
    ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
    ['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 'https://images.unsplash.com/photo-1599643478877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500'],
    ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500'],
    ['https://images.unsplash.com/photo-1611591437046-d1e9c1c63bfe?w=500', 'https://images.unsplash.com/photo-1534531688091-1be1c2f9a1e8?w=500', 'https://images.unsplash.com/photo-1599643477999-38f0c08d6ec0?w=500'],
    ['https://images.unsplash.com/photo-1604867555825-f9c0e8500ee2?w=500', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500'],
    ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500'],
    ['https://images.unsplash.com/photo-1522707711440-2bca2a4e3c6d?w=500', 'https://images.unsplash.com/photo-1583003096958-95a89ec1a7a3?w=500', 'https://images.unsplash.com/photo-1599643478572-ec12f8d16a49?w=500']
  ]
};

async function updateProductImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const categories = await Category.find();
    let totalUpdated = 0;

    for (const category of categories) {
      console.log(`📦 Đang cập nhật ảnh cho danh mục: ${category.name}`);
      
      const images = imageMap[category.name];
      if (!images) {
        console.log(`⚠️  Không có ảnh cho danh mục ${category.name}\n`);
        continue;
      }

      // Lấy tất cả sản phẩm của danh mục này
      const products = await Product.find({ category: category._id }).limit(10);
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const imageSet = images[i] || images[0]; // Nếu không đủ ảnh, dùng lại ảnh đầu
        
        product.images = imageSet;
        await product.save();
        
        console.log(`  ✅ ${i + 1}. ${product.name}`);
        totalUpdated++;
      }
      
      console.log('');
    }

    console.log(`\n🎉 Hoàn thành! Đã cập nhật ảnh cho ${totalUpdated} sản phẩm.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateProductImages();
