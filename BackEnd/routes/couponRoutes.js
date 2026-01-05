const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { authenticate } = require('../middleware/authMiddleware');

// User: Áp dụng coupon
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã bị vô hiệu hóa' });
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa có hiệu lực' });
    }
    if (now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng phải có giá trị tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ` 
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Đảm bảo giảm giá không vượt quá tổng tiền (tối thiểu là 0đ)
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    const finalTotal = Math.max(0, orderTotal - discountAmount);

    res.json({ 
      success: true, 
      message: 'Áp dụng mã giảm giá thành công',
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount,
      finalTotal
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Tạo coupon
router.post('/admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ admin mới được thực hiện' });
    }
    
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit || null
    });

    await coupon.save();
    res.json({ success: true, message: 'Tạo mã giảm giá thành công', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Lấy tất cả coupon
router.get('/admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ admin mới được thực hiện' });
    }
    
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Cập nhật coupon
router.put('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ admin mới được thực hiện' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    res.json({ success: true, message: 'Cập nhật thành công', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Xóa coupon
router.delete('/admin/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ admin mới được thực hiện' });
    }
    
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
