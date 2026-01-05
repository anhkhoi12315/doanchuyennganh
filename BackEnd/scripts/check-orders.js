// Check orders in database
const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const User = require('../models/User');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const orders = await Order.find().populate('user', 'username email fullname phone').sort('-createdAt').limit(10);
    
    console.log('\n📦 Orders in database:');
    console.log('='.repeat(80));
    console.log(`Total orders: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('\n❌ No orders found in database!');
      console.log('You need to create an order from the frontend first.');
    } else {
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order #${order.orderNumber}`);
        console.log(`   ID: ${order._id}`);
        console.log(`   User: ${order.user?.fullname || order.user?.email || 'N/A'}`);
        console.log(`   Status: ${order.orderStatus}`);
        console.log(`   Total: ${order.total.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   Items: ${order.items.length}`);
        console.log(`   Created: ${order.createdAt.toLocaleString('vi-VN')}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
