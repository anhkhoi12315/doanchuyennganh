const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Product = require('../models/Product');

dotenv.config();

// Dữ liệu sản phẩm mẫu cho mỗi danh mục
// Material: "gold", "silver", "diamond", "platinum", "pearl", "gemstone", "mixed"
// Style: "classic", "modern", "vintage", "minimalist", "luxury"
const productTemplates = {
  'Mặt dây chuyền': [
    { name: 'Mặt Dây Chuyền Bạc Ý 925 Đính Đá CZ', price: 850000, material: 'silver', style: 'modern' },
    { name: 'Mặt Dây Chuyền Vàng 18K Hình Trái Tim', price: 3500000, material: 'gold', style: 'luxury' },
    { name: 'Mặt Dây Chuyền Bạc Đính Ngọc Trai', price: 1200000, material: 'pearl', style: 'classic' },
    { name: 'Mặt Dây Chuyền Kim Cương Thiên Nhiên', price: 15000000, material: 'diamond', style: 'luxury' },
    { name: 'Mặt Dây Chuyền Bạc Hình Ngôi Sao', price: 680000, material: 'silver', style: 'modern' },
    { name: 'Mặt Dây Chuyền Vàng Tây Đính Đá Topaz', price: 4200000, material: 'gemstone', style: 'luxury' },
    { name: 'Mặt Dây Chuyền Bạc Hình Infinity', price: 750000, material: 'silver', style: 'minimalist' },
    { name: 'Mặt Dây Chuyền Vàng Hồng 10K', price: 2800000, material: 'gold', style: 'modern' },
    { name: 'Mặt Dây Chuyền Bạc Đính Đá Zircon', price: 920000, material: 'silver', style: 'modern' },
    { name: 'Mặt Dây Chuyền Vàng Hình Cỏ 4 Lá', price: 3200000, material: 'gold', style: 'classic' }
  ],
  'Dây chuyền': [
    { name: 'Dây Chuyền Bạc Ý 925 Mảnh', price: 650000, material: 'silver', style: 'minimalist' },
    { name: 'Dây Chuyền Vàng 18K Xoắn', price: 5500000, material: 'gold', style: 'luxury' },
    { name: 'Dây Chuyền Bạc Kiểu Dáng Đơn Giản', price: 450000, material: 'silver', style: 'minimalist' },
    { name: 'Dây Chuyền Vàng Tây Dây Nữ', price: 4800000, material: 'gold', style: 'modern' },
    { name: 'Dây Chuyền Bạc Tròn Nhỏ', price: 550000, material: 'silver', style: 'minimalist' },
    { name: 'Dây Chuyền Vàng Hồng Nữ Cao Cấp', price: 6200000, material: 'gold', style: 'luxury' },
    { name: 'Dây Chuyền Bạc Ý Kiểu Xích', price: 780000, material: 'silver', style: 'modern' },
    { name: 'Dây Chuyền Vàng Trắng Thanh Lịch', price: 5800000, material: 'gold', style: 'luxury' },
    { name: 'Dây Chuyền Bạc Dây Mỏng', price: 480000, material: 'silver', style: 'minimalist' },
    { name: 'Dây Chuyền Vàng 24K Dây To', price: 12000000, material: 'gold', style: 'classic' }
  ],
  'Lắc tay': [
    { name: 'Lắc Tay Bạc Nữ Dây Xích', price: 850000, material: 'silver', style: 'modern' },
    { name: 'Lắc Tay Vàng 18K Kiểu Xoắn', price: 4500000, material: 'gold', style: 'luxury' },
    { name: 'Lắc Tay Bạc Charm Trái Tim', price: 950000, material: 'silver', style: 'modern' },
    { name: 'Lắc Tay Vàng Tây Đính Đá', price: 5200000, material: 'gemstone', style: 'luxury' },
    { name: 'Lắc Tay Bạc Kiểu Dáng Đơn Giản', price: 650000, material: 'silver', style: 'minimalist' },
    { name: 'Lắc Tay Vàng Hồng Nữ', price: 3800000, material: 'gold', style: 'modern' },
    { name: 'Lắc Tay Bạc Đính Ngọc Trai', price: 1200000, material: 'pearl', style: 'classic' },
    { name: 'Lắc Tay Vàng Trắng Cao Cấp', price: 6500000, material: 'gold', style: 'luxury' },
    { name: 'Lắc Tay Bạc Ý Dây Mảnh', price: 720000, material: 'silver', style: 'minimalist' },
    { name: 'Lắc Tay Vàng 24K Truyền Thống', price: 8500000, material: 'gold', style: 'classic' }
  ],
  'Bông tai': [
    { name: 'Bông Tai Bạc Nụ Nhỏ', price: 350000, material: 'silver', style: 'minimalist' },
    { name: 'Bông Tai Vàng 18K Đính Kim Cương', price: 8500000, material: 'diamond', style: 'luxury' },
    { name: 'Bông Tai Bạc Đính Đá CZ', price: 480000, material: 'silver', style: 'modern' },
    { name: 'Bông Tai Vàng Tây Hình Tròn', price: 2800000, material: 'gold', style: 'classic' },
    { name: 'Bông Tai Bạc Dài Đính Ngọc Trai', price: 650000, material: 'pearl', style: 'classic' },
    { name: 'Bông Tai Vàng Hồng Hình Trái Tim', price: 3200000, material: 'gold', style: 'modern' },
    { name: 'Bông Tai Bạc Ý Kiểu Tròn', price: 420000, material: 'silver', style: 'minimalist' },
    { name: 'Bông Tai Vàng Trắng Đính Đá Topaz', price: 4500000, material: 'gemstone', style: 'luxury' },
    { name: 'Bông Tai Bạc Hình Ngôi Sao', price: 380000, material: 'silver', style: 'modern' },
    { name: 'Bông Tai Vàng 24K Truyền Thống', price: 6800000, material: 'gold', style: 'classic' }
  ],
  'Nhẫn': [
    { name: 'Nhẫn Bạc Ý 925 Đính Đá', price: 1200000, material: 'silver', style: 'modern' },
    { name: 'Nhẫn Vàng 18K Kim Cương', price: 12500000, material: 'diamond', style: 'luxury' },
    { name: 'Nhẫn Bạc Đơn Giản', price: 450000, material: 'silver', style: 'minimalist' },
    { name: 'Nhẫn Vàng Tây Đính Đá Ruby', price: 5800000, material: 'gemstone', style: 'luxury' },
    { name: 'Nhẫn Bạc Cưới Đôi', price: 1600000, material: 'silver', style: 'classic' },
    { name: 'Nhẫn Vàng Hồng Nữ', price: 3500000, material: 'gold', style: 'modern' },
    { name: 'Nhẫn Bạc Ý Kiểu Xoắn', price: 850000, material: 'silver', style: 'modern' },
    { name: 'Nhẫn Vàng Trắng Cao Cấp', price: 7200000, material: 'gold', style: 'luxury' },
    { name: 'Nhẫn Bạc Đính Ngọc Trai', price: 950000, material: 'pearl', style: 'classic' },
    { name: 'Nhẫn Vàng 24K Phong Thủy', price: 9500000, material: 'gold', style: 'classic' }
  ],
  'Vòng tay': [
    { name: 'Vòng Tay Bạc Nữ Charm', price: 1200000, material: 'silver', style: 'modern' },
    { name: 'Vòng Tay Vàng 18K Xoắn', price: 6500000, material: 'gold', style: 'luxury' },
    { name: 'Vòng Tay Bạc Ý Đơn Giản', price: 850000, material: 'silver', style: 'minimalist' },
    { name: 'Vòng Tay Vàng Tây Đính Đá', price: 5200000, material: 'gemstone', style: 'luxury' },
    { name: 'Vòng Tay Bạc Đính Ngọc Trai', price: 1500000, material: 'pearl', style: 'classic' },
    { name: 'Vòng Tay Vàng Hồng Nữ Cao Cấp', price: 4800000, material: 'gold', style: 'modern' },
    { name: 'Vòng Tay Bạc Kiểu Dáng Mảnh', price: 720000, material: 'silver', style: 'minimalist' },
    { name: 'Vòng Tay Vàng Trắng Đính Kim Cương', price: 9500000, material: 'diamond', style: 'luxury' },
    { name: 'Vòng Tay Bạc Ý Dây Xích', price: 950000, material: 'silver', style: 'modern' },
    { name: 'Vòng Tay Vàng 24K Phong Thủy', price: 12000000, material: 'gold', style: 'classic' }
  ]
};

async function addProductsToCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const categories = await Category.find();
    let totalAdded = 0;

    for (const category of categories) {
      console.log(`\n📦 Đang thêm sản phẩm cho danh mục: ${category.name}`);
      
      const templates = productTemplates[category.name];
      if (!templates) {
        console.log(`⚠️  Không có template cho danh mục ${category.name}`);
        continue;
      }

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        
        try {
          // Tạo slug từ tên sản phẩm
          const slug = template.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Tạo salePrice (giảm 10-30%)
          const discountPercent = Math.floor(Math.random() * 20) + 10; // 10-30%
          const salePrice = Math.floor(template.price * (100 - discountPercent) / 100);

          const productData = {
            name: template.name,
            slug: slug,
            category: category._id,
            price: template.price,
            salePrice: salePrice,
            description: `${template.name} chất lượng cao, thiết kế ${template.style.toLowerCase()}, phù hợp cho mọi lứa tuổi.`,
            material: template.material,
            style: template.style,
            stock: Math.floor(Math.random() * 50) + 20, // 20-70 sản phẩm
            weight: Math.floor(Math.random() * 30) + 5, // 5-35g
            size: ['M', 'L'],
            images: [
              '/img/default-product.jpg',
              '/img/default-product-2.jpg'
            ],
            isActive: true,
            isFeatured: i < 3 // 3 sản phẩm đầu là featured
          };

          const product = new Product(productData);
          await product.save();
          
          console.log(`  ✅ ${i + 1}. ${product.name} - ${product.price.toLocaleString()}đ (Sale: ${product.salePrice.toLocaleString()}đ)`);
          totalAdded++;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`  ⚠️  ${i + 1}. ${template.name} - Đã tồn tại, bỏ qua`);
          } else {
            console.log(`  ❌ ${i + 1}. ${template.name} - Lỗi: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n\n🎉 Hoàn thành! Đã thêm tổng cộng ${totalAdded} sản phẩm vào database.`);
    console.log(`📊 Trung bình ${Math.floor(totalAdded / categories.length)} sản phẩm mỗi danh mục.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addProductsToCategories();
