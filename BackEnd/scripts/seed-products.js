const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { name: 'Vòng tay bạc', price: 199000, description: 'Vòng tay bạc miếng', images: [], category: 'Vòng tay', stock: 10 },
  { name: 'Nhẫn vàng', price: 499000, description: 'Nhẫn vàng đẹp', images: [], category: 'Nhẫn', stock: 5 },
  { name: 'Dây chuyền bạc', price: 299000, description: 'Dây chuyền tinh xảo', images: [], category: 'Dây chuyền', stock: 8 }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Seed sản phẩm hoàn thành');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Lỗi seed:', err.message);
    process.exit(1);
  }
})();
