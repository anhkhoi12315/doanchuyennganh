const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config();

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const categories = await Category.find();
    
    console.log('\n📊 Danh sách danh mục:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (slug: ${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCategories();
