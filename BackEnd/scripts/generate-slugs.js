require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function generateSlugs() {
  try {
    console.log('\n=== GENERATE SLUGS CHO SAN PHAM ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Ket noi MongoDB\n');
    
    // Lấy tất cả sản phẩm không có slug hoặc slug trống
    const products = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`Tim thay ${products.length} san pham can tao slug\n`);
    
    let count = 0;
    for (const product of products) {
      // Tạo slug từ tên sản phẩm
      const slug = product.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Kiểm tra slug đã tồn tại chưa
      let finalSlug = slug;
      let suffix = 1;
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: product._id } })) {
        finalSlug = `${slug}-${suffix}`;
        suffix++;
      }
      
      product.slug = finalSlug;
      await product.save();
      
      count++;
      console.log(`${count}. ${product.name}`);
      console.log(`   -> Slug: ${finalSlug}`);
    }
    
    console.log(`\n✓ Da tao slug cho ${count} san pham!\n`);
    
    // Kiểm tra lại
    const check = await Product.find({ slug: { $exists: true, $ne: null, $ne: '' } }).countDocuments();
    console.log(`Tong san pham co slug: ${check}\n`);
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('\nX LOI:', error.message);
    console.error(error);
    process.exit(1);
  }
}

generateSlugs();
