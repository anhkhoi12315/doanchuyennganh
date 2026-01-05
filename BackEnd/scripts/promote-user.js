const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const User = require('../models/User');

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: node scripts/promote-user.js <emailOrUsername>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) {
      console.error('User not found:', identifier);
      await mongoose.disconnect();
      process.exit(1);
    }
    if (user.role === 'admin') {
      console.log('User is already admin:', user.username || user.email);
      await mongoose.disconnect();
      process.exit(0);
    }
    user.role = 'admin';
    await user.save();
    console.log('User promoted to admin:', user.username, user.email);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err.message);
    process.exit(1);
  }
})();
