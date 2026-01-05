const mongoose = require("mongoose"); 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  district: {
    type: String,
    default: null,
  },
  ward: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: "",
  },
  birthday: {
    type: Date,
    default: null,
  },
  age: {
    type: Number,
    default: null,
  },
  preferences: {
    style: [String], // Phong cách yêu thích: "classic", "modern", "vintage", etc.
    material: [String], // Chất liệu yêu thích: "gold", "silver", "diamond", etc.
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: null }
    }
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
