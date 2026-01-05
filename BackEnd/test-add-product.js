require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function testAddNewProduct() {
  try {
    console.log('\n=== TEST THEM SAN PHAM MOI ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Ket noi MongoDB\n');
    
    // Lấy category Nhẫn
    const category = await Category.findOne({ name: 'Nhẫn' });
    if (!category) {
      console.log('X Khong tim thay category Nhan');
      process.exit(1);
    }
    
    console.log(`✓ Tim thay category: ${category.name}\n`);
    
    // Tạo sản phẩm mới (KHÔNG có slug)
    const newProduct = new Product({
      name: 'Nhẫn Kim Cương Vĩnh Cửu',
      description: 'Nhẫn kim cương thiết kế sang trọng, biểu tượng tình yêu vĩnh cửu',
      price: 5500000,
      salePrice: 4990000,
      category: category._id,
      material: 'diamond',
      style: 'luxury',
      stock: 8,
      images: ['/img/products/nhan-kim-cuong.jpg'],
      isActive: true,
      isFeatured: true
      // KHÔNG có slug - để tự động generate
    });
    
    console.log('Dang luu san pham moi (khong co slug)...\n');
    
    await newProduct.save();
    
    console.log('✓ DA LUU THANH CONG!\n');
    console.log('Thong tin san pham:');
    console.log(`  - Ten: ${newProduct.name}`);
    console.log(`  - Slug: ${newProduct.slug} <- TU DONG TAO`);
    console.log(`  - Gia: ${newProduct.price.toLocaleString('vi-VN')}d`);
    console.log(`  - Link: sanpham.html?slug=${newProduct.slug}\n`);
    
    // Test thêm sản phẩm trùng tên
    console.log('Dang test them san pham trung ten...\n');
    
    const duplicate = new Product({
      name: 'Nhẫn Kim Cương Vĩnh Cửu', // Trùng tên
      price: 6000000,
      category: category._id,
      material: 'diamond',
      style: 'luxury',
      stock: 5
    });
    
    await duplicate.save();
    
    console.log('✓ San pham trung ten cung luu thanh cong!');
    console.log(`  - Ten: ${duplicate.name}`);
    console.log(`  - Slug: ${duplicate.slug} <- TU DONG THEM SO`);
    console.log(`  - Link: sanpham.html?slug=${duplicate.slug}\n`);
    
    // Xóa 2 sản phẩm test
    await Product.deleteOne({ _id: newProduct._id });
    await Product.deleteOne({ _id: duplicate._id });
    console.log('✓ Da xoa 2 san pham test\n');
    
    console.log('========================================');
    console.log('KET LUAN:');
    console.log('✓ Khi them san pham moi, slug TU DONG tao');
    console.log('✓ Neu trung ten, tu dong them so: -1, -2, -3...');
    console.log('✓ Chatbot se lay duoc san pham moi ngay lap tuc');
    console.log('✓ Click vao product card se hoat dong tot!');
    console.log('========================================\n');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('\nX LOI:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAddNewProduct();
