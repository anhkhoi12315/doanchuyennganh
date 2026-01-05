const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const username = process.argv[2] || 'testuser';
    const password = process.argv[3] || 'testpass';
    const email = process.argv[4] || 'testuser@example.com';

    let user = await User.findOne({ username });
    if (user) {
      console.log('User already exists:', username);
      await mongoose.disconnect();
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 10);
    user = new User({ username, fullname: username, gender: 'other', email, password: hashed, role: 'user', birthday: new Date('1995-01-01') });
    await user.save();
    console.log('Test user created:', username, password);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err.message);
    process.exit(1);
  }
})();
