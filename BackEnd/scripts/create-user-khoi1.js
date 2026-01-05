const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://khoi:12345@quochung.e6kffux.mongodb.net/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullname: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  ward: { type: String },
  gender: { type: String },
  birthday: { type: Date },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Create user
const createUser = async () => {
  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ username: 'khoi1' });
    if (existingUser) {
      console.log('⚠️ User khoi1 already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('1', 10);

    // Create new user
    const newUser = new User({
      username: 'khoi1',
      email: 'khoi1@example.com',
      password: hashedPassword,
      fullname: 'Khoi User',
      phone: '0123456789',
      role: 'user'
    });

    await newUser.save();

    console.log('✅ User created successfully!');
    console.log('Username: khoi1');
    console.log('Password: 1');
    console.log('Email: khoi1@example.com');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user:', err);
    process.exit(1);
  }
};

createUser();
