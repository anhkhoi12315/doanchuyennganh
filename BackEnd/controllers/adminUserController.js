const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');

// Lấy danh sách tất cả users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role,
      isActive 
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullname: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password -refreshToken -resetPasswordToken')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: err.message
    });
  }
};

// Lấy thông tin user theo ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Lấy thống kê đơn hàng của user
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: orderStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          completedOrders: 0
        }
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      error: err.message
    });
  }
};

// Cập nhật thông tin user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { 
      fullname, 
      email, 
      phone, 
      address, 
      gender, 
      birthday,
      role,
      isActive 
    } = req.body;

    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (gender) updateData.gender = gender;
    if (birthday) updateData.birthday = birthday;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Cập nhật thông tin thành công'
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Lỗi cập nhật thông tin',
      error: err.message
    });
  }
};

// Khóa/Mở khóa tài khoản (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép khóa tài khoản admin
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa tài khoản quản trị viên'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi thay đổi trạng thái tài khoản',
      error: err.message
    });
  }
};

// Xóa user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép xóa tài khoản admin
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản quản trị viên'
      });
    }

    // Kiểm tra xem user có đơn hàng không
    const hasOrders = await Order.exists({ user: user._id });
    
    if (hasOrders) {
      // Thay vì xóa, chỉ vô hiệu hóa tài khoản
      user.isActive = false;
      await user.save();

      return res.json({
        success: true,
        message: 'Đã vô hiệu hóa tài khoản (do có lịch sử đơn hàng)'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Đã xóa người dùng'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa người dùng',
      error: err.message
    });
  }
};

// Thay đổi role user (Admin only)
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user,
      message: `Đã đổi quyền thành ${role}`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi thay đổi quyền',
      error: err.message
    });
  }
};

// Thống kê users (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Users đăng ký theo tháng
    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Top users theo tổng chi tiêu
    const topSpenders = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByMonth,
        topSpenders
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê',
      error: err.message
    });
  }
};

// Reset mật khẩu cho user (Admin only)
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.refreshToken = null; // Logout user
    await user.save();

    res.json({
      success: true,
      message: 'Đã reset mật khẩu thành công'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi reset mật khẩu',
      error: err.message
    });
  }
};
