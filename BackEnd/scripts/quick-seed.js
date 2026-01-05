// Quick script to add sample products to database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://khoi:12345@quochung.e6kffux.mongodb.net/bantrangsuc?retryWrites=true&w=majority';

// Models
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  salePrice: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [String],
  material: String,
  style: String,
  stock: Number,
  weight: Number,
  sold: { type: Number, default: 0 }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function seedProducts() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Create categories first
    console.log('📦 Tạo danh mục...');
    await Category.deleteMany({});
    
    const categories = await Category.insertMany([
      {
        name: 'Nhẫn',
        description: 'Nhẫn vàng, bạc, kim cương cao cấp',
        image: '/img/nhan.webp'
      },
      {
        name: 'Dây chuyền',
        description: 'Dây chuyền thời trang, sang trọng',
        image: '/img/day-chuyen.webp'
      },
      {
        name: 'Bông tai',
        description: 'Bông tai đẹp, tinh tế',
        image: '/img/bong-tai.jpg'
      },
      {
        name: 'Vòng tay',
        description: 'Vòng tay may mắn, phong thủy',
        image: '/img/lac-tay.webp'
      },
      {
        name: 'Lắc tay',
        description: 'Lắc tay vàng, bạc',
        image: '/img/lac-tay.webp'
      },
      {
        name: 'Mặt dây chuyền',
        description: 'Mặt dây chuyền đẹp',
        image: '/img/day-chuyen.webp'
      }
    ]);
    
    console.log(`✅ Đã tạo ${categories.length} danh mục`);

    // Delete existing products
    await Product.deleteMany({});
    console.log('🗑️ Đã xóa sản phẩm cũ');

    // Create products
    const products = [
      {
        name: 'Nhẫn Kim Cương Vàng Trắng 18K',
        description: 'Nhẫn kim cương vàng trắng 18K, thiết kế sang trọng, phù hợp với mọi phong cách',
        price: 25000000,
        salePrice: 22000000,
        category: categories[0]._id,
        images: ['/img/nhan.webp', '/img/nhan.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 15,
        weight: 3.5,
        sold: 45
      },
      {
        name: 'Nhẫn Bạc Ý 925 Đính Đá CZ',
        description: 'Nhẫn bạc Ý cao cấp, đính đá CZ lấp lánh',
        price: 1500000,
        salePrice: 1200000,
        category: categories[0]._id,
        images: ['/img/nhan.webp'],
        material: 'silver',
        style: 'modern',
        stock: 30,
        weight: 2.8,
        sold: 120
      },
      {
        name: 'Dây Chuyền Vàng 24K Mặt Rồng',
        description: 'Dây chuyền vàng 24K nguyên chất, mặt rồng phong thủy',
        price: 35000000,
        salePrice: 33000000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'gold',
        style: 'classic',
        stock: 8,
        weight: 15.2,
        sold: 28
      },
      {
        name: 'Dây Chuyền Bạc Nữ Đính Ngọc Trai',
        description: 'Dây chuyền bạc cao cấp, đính ngọc trai thiên nhiên',
        price: 2800000,
        salePrice: 2500000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 25,
        weight: 4.5,
        sold: 85
      },
      {
        name: 'Bông Tai Kim Cương Thiên Nhiên',
        description: 'Bông tai kim cương thiên nhiên, chất lượng cao',
        price: 18000000,
        salePrice: 16500000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'gold',
        style: 'luxury',
        stock: 12,
        weight: 2.2,
        sold: 35
      },
      {
        name: 'Bông Tai Bạc Hình Bướm',
        description: 'Bông tai bạc hình bướm xinh xắn, phù hợp tuổi teen',
        price: 800000,
        salePrice: 650000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'silver',
        style: 'modern',
        stock: 40,
        weight: 1.5,
        sold: 156
      },
      {
        name: 'Vòng Tay Vàng 18K Phong Thủy',
        description: 'Vòng tay vàng 18K may mắn, phong thủy tài lộc',
        price: 12000000,
        salePrice: 11000000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'classic',
        stock: 18,
        weight: 8.5,
        sold: 52
      },
      {
        name: 'Vòng Tay Charm Bạc Đính Đá',
        description: 'Vòng tay charm bạc, có thể thay đổi charm theo sở thích',
        price: 1800000,
        salePrice: 1500000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'modern',
        stock: 35,
        weight: 3.2,
        sold: 98
      },
      {
        name: 'Lắc Tay Vàng Tây Ý Cao Cấp',
        description: 'Lắc tay vàng tây 10K nhập khẩu Ý',
        price: 8500000,
        salePrice: 7800000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 10,
        weight: 6.8,
        sold: 42
      },
      {
        name: 'Lắc Tay Bạc Nữ Dây Xích',
        description: 'Lắc tay bạc nữ thiết kế dây xích tinh tế',
        price: 950000,
        salePrice: 850000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'minimalist',
        stock: 45,
        weight: 2.5,
        sold: 134
      },
      {
        name: 'Nhẫn Cưới Vàng Trắng 18K Đính Kim Cương',
        description: 'Nhẫn cưới cao cấp, vàng trắng 18K đính kim cương thiên nhiên',
        price: 32000000,
        salePrice: 30000000,
        category: categories[0]._id,
        images: ['/img/nhan.webp'],
        material: 'gold',
        style: 'luxury',
        stock: 6,
        weight: 4.2,
        sold: 15
      },
      {
        name: 'Dây Chuyền Bạc Nam Mặt Chữ Thập',
        description: 'Dây chuyền bạc nam mạnh mẽ, mặt chữ thập',
        price: 1200000,
        salePrice: 1000000,
        category: categories[1]._id,
        images: ['/img/day-chuyen.webp'],
        material: 'silver',
        style: 'modern',
        stock: 28,
        weight: 5.5,
        sold: 67
      },
      {
        name: 'Bông Tai Vàng Tây Hình Trái Tim',
        description: 'Bông tai vàng tây 10K hình trái tim đáng yêu',
        price: 3500000,
        salePrice: 3200000,
        category: categories[2]._id,
        images: ['/img/bong-tai.jpg'],
        material: 'gold',
        style: 'modern',
        stock: 20,
        weight: 1.8,
        sold: 78
      },
      {
        name: 'Vòng Tay Charm Vintage',
        description: 'Vòng tay charm phong cách vintage độc đáo',
        price: 2200000,
        salePrice: 1900000,
        category: categories[3]._id,
        images: ['/img/lac-tay.webp'],
        material: 'silver',
        style: 'vintage',
        stock: 15,
        weight: 4.0,
        sold: 45
      },
      {
        name: 'Lắc Tay Trẻ Em Vàng 24K',
        description: 'Lắc tay trẻ em vàng 24K nguyên chất, may mắn',
        price: 4500000,
        salePrice: 4200000,
        category: categories[4]._id,
        images: ['/img/lac-tay.webp'],
        material: 'gold',
        style: 'classic',
        stock: 22,
        weight: 2.0,
        sold: 89
      }
    ];

    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Đã tạo ${insertedProducts.length} sản phẩm`);

    console.log('\n📊 Tổng kết:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${insertedProducts.length}`);
    console.log('\n🎉 Hoàn thành! Bây giờ có thể test được rồi!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedProducts();
