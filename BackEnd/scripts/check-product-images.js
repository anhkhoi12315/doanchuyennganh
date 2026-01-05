// Check product images in database
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');

async function checkProductImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const products = await Product.find().limit(10);
    
    console.log('\n📦 Products in database:');
    console.log('='.repeat(80));
    
    products.forEach(p => {
      console.log(`\n📌 ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Images (${p.images?.length || 0}):`);
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          console.log(`     ${i + 1}. ${img.substring(0, 100)}${img.length > 100 ? '...' : ''}`);
        });
      } else {
        console.log(`     (No images)`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Found ${products.length} products`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProductImages();
