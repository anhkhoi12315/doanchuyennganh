const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const argv = process.argv.slice(2);
const username = argv[0] || process.env.ADMIN_USERNAME || 'admin';
const password = argv[1] || process.env.ADMIN_PASSWORD || 'admin123';
const email = argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    let user = await User.findOne({ username });
    if (user) {
      console.log('User already exists:', username);
      await mongoose.disconnect();
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 10);
    user = new User({ username, fullname: username, gender: 'other', email, password: hashed, role: 'admin', birthday: new Date('1990-01-01') });
    await user.save();
    console.log('Admin user created:', username);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
})();
