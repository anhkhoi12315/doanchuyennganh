const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');

const connectDB = require('../config/db');

const categories = [
  {
    name: 'Nhẫn',
    description: 'Nhẫn kim cương, nhẫn vàng, nhẫn bạc cao cấp',
    image: '/img/categories/nhan.jpg'
  },
  {
    name: 'Dây chuyền',
    description: 'Dây chuyền vàng, bạc và kim cương sang trọng',
    image: '/img/categories/daychuyen.jpg'
  },
  {
    name: 'Bông tai',
    description: 'Bông tai thời trang, bông tai kim cương',
    image: '/img/categories/bongtai.jpg'
  },
  {
    name: 'Vòng tay',
    description: 'Vòng tay vàng, bạc, đá quý',
    image: '/img/categories/vongtay.jpg'
  },
  {
    name: 'Lắc',
    description: 'Lắc tay, lắc chân cao cấp',
    image: '/img/categories/lac.jpg'
  },
  {
    name: 'Mặt dây chuyền',
    description: 'Mặt dây chuyền vàng, bạc, kim cương',
    image: '/img/categories/matdaychuyen.jpg'
  }
];

const products = [
  // Nhẫn
  {
    name: 'Nhẫn kim cương vàng 18K',
    description: 'Nhẫn kim cương thiên nhiên 5ly, vàng 18K cao cấp. Thiết kế sang trọng, lộng lẫy.',
    price: 25000000,
    salePrice: 22000000,
    images: ['/img/products/nhan-kimcuong-1.jpg'],
    material: 'diamond',
    style: 'luxury',
    stock: 5,
    sold: 12,
    isFeatured: true,
    tags: ['nhẫn', 'kim cương', 'vàng', 'cưới'],
    weight: 5.2
  },
  {
    name: 'Nhẫn bạc 925 đính đá CZ',
    description: 'Nhẫn bạc Ý 925 đính đá CZ lấp lánh. Kiểu dáng hiện đại, phù hợp mọi lứa tuổi.',
    price: 850000,
    salePrice: 750000,
    images: ['/img/products/nhan-bac-1.jpg'],
    material: 'silver',
    style: 'modern',
    stock: 20,
    sold: 45,
    isFeatured: true,
    tags: ['nhẫn', 'bạc', 'thời trang'],
    weight: 3.5
  },
  {
    name: 'Nhẫn vàng tây 10K trơn',
    description: 'Nhẫn vàng tây 10K trơn đơn giản, thanh lịch. Phù hợp đeo hàng ngày.',
    price: 3500000,
    images: ['/img/products/nhan-vang-1.jpg'],
    material: 'gold',
    style: 'minimalist',
    stock: 15,
    sold: 28,
    tags: ['nhẫn', 'vàng', 'minimalist'],
    weight: 2.8
  },

  // Dây chuyền
  {
    name: 'Dây chuyền vàng 18K Italy',
    description: 'Dây chuyền vàng 18K nhập khẩu Italy. Thiết kế tinh xảo, bền đẹp theo thời gian.',
    price: 12000000,
    salePrice: 11500000,
    images: ['/img/products/daychuyen-vang-1.jpg'],
    material: 'gold',
    style: 'classic',
    stock: 8,
    sold: 15,
    isFeatured: true,
    tags: ['dây chuyền', 'vàng', 'italy'],
    weight: 10.5
  },
  {
    name: 'Dây chuyền bạc nữ đính ngọc trai',
    description: 'Dây chuyền bạc 925 đính ngọc trai tự nhiên. Sang trọng và nữ tính.',
    price: 1200000,
    images: ['/img/products/daychuyen-bac-1.jpg'],
    material: 'pearl',
    style: 'classic',
    stock: 12,
    sold: 32,
    tags: ['dây chuyền', 'bạc', 'ngọc trai'],
    weight: 8.2
  },

  // Bông tai
  {
    name: 'Bông tai kim cương thiên nhiên',
    description: 'Bông tai kim cương thiên nhiên 3ly, vàng trắng 18K. Tỏa sáng rực rỡ.',
    price: 18000000,
    salePrice: 16500000,
    images: ['/img/products/bongtai-kimcuong-1.jpg'],
    material: 'diamond',
    style: 'luxury',
    stock: 6,
    sold: 9,
    isFeatured: true,
    tags: ['bông tai', 'kim cương', 'sang trọng'],
    weight: 4.0
  },
  {
    name: 'Bông tai bạc nữ thời trang',
    description: 'Bông tai bạc 925 kiểu dáng hiện đại. Nhẹ nhàng, phù hợp đeo hàng ngày.',
    price: 450000,
    images: ['/img/products/bongtai-bac-1.jpg'],
    material: 'silver',
    style: 'modern',
    stock: 30,
    sold: 67,
    tags: ['bông tai', 'bạc', 'thời trang'],
    weight: 2.5
  },

  // Vòng tay
  {
    name: 'Vòng tay vàng 24K rồng phượng',
    description: 'Vòng tay vàng 24K họa tiết rồng phượng truyền thống. Sang trọng, may mắn.',
    price: 35000000,
    images: ['/img/products/vongtay-vang-1.jpg'],
    material: 'gold',
    style: 'classic',
    stock: 3,
    sold: 5,
    isFeatured: true,
    tags: ['vòng tay', 'vàng', 'truyền thống'],
    weight: 25.0
  },
  {
    name: 'Vòng tay bạc charm đá quý',
    description: 'Vòng tay bạc 925 với các charm đá quý phong phú. Cá tính và độc đáo.',
    price: 980000,
    salePrice: 850000,
    images: ['/img/products/vongtay-bac-1.jpg'],
    material: 'gemstone',
    style: 'modern',
    stock: 18,
    sold: 41,
    tags: ['vòng tay', 'bạc', 'đá quý', 'charm'],
    weight: 12.0
  },

  // Lắc
  {
    name: 'Lắc tay vàng trắng 18K',
    description: 'Lắc tay vàng trắng 18K thiết kế xoắn ốc tinh tế. Quyến rũ và sang trọng.',
    price: 8500000,
    images: ['/img/products/lac-vang-1.jpg'],
    material: 'gold',
    style: 'luxury',
    stock: 7,
    sold: 11,
    tags: ['lắc', 'vàng trắng'],
    weight: 6.8
  },
  {
    name: 'Lắc chân bạc nữ',
    description: 'Lắc chân bạc 925 với họa tiết lá và chuông nhỏ. Nữ tính và dễ thương.',
    price: 550000,
    images: ['/img/products/lac-bac-1.jpg'],
    material: 'silver',
    style: 'modern',
    stock: 25,
    sold: 38,
    tags: ['lắc chân', 'bạc', 'nữ tính'],
    weight: 4.5
  },

  // Mặt dây chuyền
  {
    name: 'Mặt Phật Di Lặc vàng 24K',
    description: 'Mặt dây chuyền Phật Di Lặc vàng 24K. Mang lại may mắn, bình an.',
    price: 15000000,
    images: ['/img/products/mat-vang-1.jpg'],
    material: 'gold',
    style: 'classic',
    stock: 10,
    sold: 18,
    isFeatured: true,
    tags: ['mặt dây chuyền', 'vàng', 'phật', 'phong thủy'],
    weight: 15.5
  },
  {
    name: 'Mặt dây chuyền bạc hình trái tim',
    description: 'Mặt dây chuyền bạc 925 hình trái tim đính đá CZ. Biểu tượng tình yêu.',
    price: 380000,
    images: ['/img/products/mat-bac-1.jpg'],
    material: 'silver',
    style: 'modern',
    stock: 35,
    sold: 89,
    tags: ['mặt dây chuyền', 'bạc', 'trái tim', 'tình yêu'],
    weight: 3.0
  }
];

async function setupDatabase() {
  try {
    await connectDB();

    console.log('🗑️  Xóa dữ liệu cũ...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Review.deleteMany({});
    await Wishlist.deleteMany({});

    console.log('👤 Tạo tài khoản admin...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      fullname: 'Quản trị viên',
      email: 'admin@bantrangsuc.com',
      password: adminPassword,
      role: 'admin',
      phone: '0123456789',
      gender: 'male',
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);

    console.log('👥 Tạo tài khoản user mẫu...');
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      username: 'nguyenvana',
      fullname: 'Nguyễn Văn A',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      phone: '0987654321',
      gender: 'male',
      birthday: new Date('1990-01-01'),
      address: 'Hà Nội',
      isActive: true
    });
    console.log('✅ User created:', user.email);

    console.log('📂 Tạo danh mục sản phẩm...');
    // Tạo từng category một để trigger pre-save hook tạo slug
    const createdCategories = [];
    for (const cat of categories) {
      const category = new Category(cat);
      await category.save();
      createdCategories.push(category);
    }
    console.log(`✅ Created ${createdCategories.length} categories`);

    console.log('💎 Tạo sản phẩm...');
    // Gán category cho sản phẩm
    const productsWithCategory = products.map((product, index) => {
      // Phân loại sản phẩm vào category
      let categoryIndex = 0;
      if (product.name.includes('Nhẫn')) categoryIndex = 0;
      else if (product.name.includes('Dây chuyền')) categoryIndex = 1;
      else if (product.name.includes('Bông tai')) categoryIndex = 2;
      else if (product.name.includes('Vòng tay')) categoryIndex = 3;
      else if (product.name.includes('Lắc')) categoryIndex = 4;
      else if (product.name.includes('Mặt')) categoryIndex = 5;

      return {
        ...product,
        category: createdCategories[categoryIndex]._id
      };
    });

    const createdProducts = await Product.insertMany(productsWithCategory);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Tạo giỏ hàng mẫu cho user
    console.log('🛒 Tạo giỏ hàng mẫu...');
    const cartItems = [
      {
        product: createdProducts[1]._id, // Nhẫn bạc
        quantity: 2,
        price: createdProducts[1].salePrice || createdProducts[1].price
      },
      {
        product: createdProducts[4]._id, // Dây chuyền bạc
        quantity: 1,
        price: createdProducts[4].price
      }
    ];
    const cart = await Cart.create({
      user: user._id,
      items: cartItems
    });
    console.log(`✅ Created cart with ${cart.items.length} items`);

    // Tạo wishlist mẫu cho user
    console.log('❤️  Tạo wishlist mẫu...');
    const wishlist = await Wishlist.create({
      user: user._id,
      products: [
        { product: createdProducts[0]._id }, // Nhẫn kim cương
        { product: createdProducts[5]._id }, // Bông tai kim cương
        { product: createdProducts[11]._id } // Mặt Phật
      ]
    });
    console.log(`✅ Created wishlist with ${wishlist.products.length} items`);

    // Tạo đơn hàng mẫu
    console.log('📦 Tạo đơn hàng mẫu...');
    const subtotal1 = createdProducts[2].price;
    const shippingFee1 = 50000;
    const total1 = subtotal1 + shippingFee1;
    
    const order1 = await Order.create({
      user: user._id,
      orderNumber: 'ORD' + Date.now(),
      items: [
        {
          product: createdProducts[2]._id, // Nhẫn vàng
          name: createdProducts[2].name,
          price: createdProducts[2].price,
          quantity: 1,
          image: createdProducts[2].images[0]
        }
      ],
      subtotal: subtotal1,
      shippingFee: shippingFee1,
      total: total1,
      paymentMethod: 'COD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      shippingAddress: {
        fullName: user.fullname,
        phone: user.phone,
        address: '123 Đường ABC, Quận 1',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh'
      },
      statusHistory: [
        { status: 'pending', note: 'Đơn hàng đã được tạo', timestamp: new Date(Date.now() - 7*24*60*60*1000) },
        { status: 'confirmed', note: 'Đã xác nhận đơn hàng', timestamp: new Date(Date.now() - 6*24*60*60*1000) },
        { status: 'processing', note: 'Đang chuẩn bị hàng', timestamp: new Date(Date.now() - 5*24*60*60*1000) },
        { status: 'shipping', note: 'Đơn hàng đang được giao', timestamp: new Date(Date.now() - 3*24*60*60*1000) },
        { status: 'delivered', note: 'Đã giao hàng thành công', timestamp: new Date(Date.now() - 1*24*60*60*1000) }
      ]
    });

    const subtotal2 = createdProducts[6].price * 2;
    const shippingFee2 = 30000;
    const total2 = subtotal2 + shippingFee2;

    const order2 = await Order.create({
      user: user._id,
      orderNumber: 'ORD' + (Date.now() + 1),
      items: [
        {
          product: createdProducts[6]._id, // Bông tai bạc
          name: createdProducts[6].name,
          price: createdProducts[6].price,
          quantity: 2,
          image: createdProducts[6].images[0]
        }
      ],
      subtotal: subtotal2,
      shippingFee: shippingFee2,
      total: total2,
      paymentMethod: 'banking',
      paymentStatus: 'paid',
      orderStatus: 'shipping',
      shippingAddress: {
        fullName: user.fullname,
        phone: user.phone,
        address: '456 Đường XYZ, Quận 2',
        ward: 'Phường An Phú',
        district: 'Quận 2',
        city: 'TP. Hồ Chí Minh'
      },
      statusHistory: [
        { status: 'pending', note: 'Đơn hàng đã được tạo', timestamp: new Date(Date.now() - 2*24*60*60*1000) },
        { status: 'confirmed', note: 'Đã xác nhận đơn hàng', timestamp: new Date(Date.now() - 1*24*60*60*1000) },
        { status: 'processing', note: 'Đang chuẩn bị hàng', timestamp: new Date(Date.now() - 12*60*60*1000) },
        { status: 'shipping', note: 'Đơn hàng đang được giao', timestamp: new Date() }
      ]
    });
    console.log(`✅ Created 2 orders`);

    // Tạo reviews mẫu
    console.log('⭐ Tạo đánh giá mẫu...');
    const reviews = await Review.insertMany([
      {
        product: createdProducts[2]._id,
        user: user._id,
        order: order1._id,
        rating: 5,
        comment: 'Sản phẩm rất đẹp, chất lượng tốt. Shop giao hàng nhanh, đóng gói cẩn thận.',
        images: [],
        isVerifiedPurchase: true,
        isApproved: true
      },
      {
        product: createdProducts[1]._id,
        user: user._id,
        rating: 4,
        comment: 'Nhẫn đẹp, giá hợp lý. Tuy nhiên hơi nhỏ so với mô tả.',
        images: [],
        isVerifiedPurchase: false,
        isApproved: true
      }
    ]);
    console.log(`✅ Created ${reviews.length} reviews`);

    console.log('\n🎉 Setup database thành công!');
    console.log('\n📊 Thống kê:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Users: 2 (1 admin + 1 user)`);
    console.log(`- Cart items: ${cart.items.length}`);
    console.log(`- Wishlist items: ${wishlist.products.length}`);
    console.log(`- Orders: 2`);
    console.log(`- Reviews: ${reviews.length}`);
    console.log('\n🔐 Thông tin đăng nhập:');
    console.log('Admin:');
    console.log('  Email: admin@bantrangsuc.com');
    console.log('  Password: admin123');
    console.log('\nUser:');
    console.log('  Email: user@example.com');
    console.log('  Password: user123');
    console.log('\n💡 User đã có:');
    console.log(`  - ${cart.items.length} sản phẩm trong giỏ hàng`);
    console.log(`  - ${wishlist.products.length} sản phẩm yêu thích`);
    console.log(`  - 2 đơn hàng (1 đã giao, 1 đang giao)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi setup database:', error);
    process.exit(1);
  }
}

setupDatabase();
