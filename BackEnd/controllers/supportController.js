const Support = require('../models/Support');

// Tạo yêu cầu hỗ trợ
exports.createSupport = async (req, res) => {
  try {
    const { name, email, phone, subject, message, category } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const supportData = {
      name,
      email,
      phone,
      subject,
      message,
      category: category || 'other'
    };

    if (req.user) {
      supportData.user = req.user._id;
    }

    const support = new Support(supportData);
    await support.save();

    res.status(201).json({
      success: true,
      data: support,
      message: 'Yêu cầu hỗ trợ đã được gửi'
    });

  } catch (err) {
    console.error('Error creating support:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi yêu cầu hỗ trợ',
      error: err.message
    });
  }
};

// Lấy danh sách yêu cầu hỗ trợ của user
exports.getUserSupports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const supports = await Support.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);

    res.json({
      success: true,
      data: supports,
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
      message: 'Lỗi lấy danh sách hỗ trợ',
      error: err.message
    });
  }
};

// Lấy chi tiết yêu cầu hỗ trợ
exports.getSupportById = async (req, res) => {
  try {
    const support = await Support.findById(req.params.id)
      .populate('user', 'username email phone')
      .populate('responses.respondedBy', 'username fullname');

    if (!support) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hỗ trợ'
      });
    }

    // Kiểm tra quyền
    if (req.user.role !== 'admin' && 
        (!support.user || support.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem yêu cầu này'
      });
    }

    res.json({
      success: true,
      data: support
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin',
      error: err.message
    });
  }
};

// ===== ADMIN FUNCTIONS =====

// Lấy tất cả yêu cầu hỗ trợ (Admin)
exports.getAllSupports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category,
      priority,
      search 
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const supports = await Support.find(query)
      .populate('user', 'username email phone')
      .populate('assignedTo', 'username fullname')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);

    res.json({
      success: true,
      data: supports,
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
      message: 'Lỗi lấy danh sách hỗ trợ',
      error: err.message
    });
  }
};

// Cập nhật trạng thái yêu cầu (Admin)
exports.updateSupportStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const support = await Support.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!support) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hỗ trợ'
      });
    }

    res.json({
      success: true,
      data: support,
      message: 'Cập nhật thành công'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật',
      error: err.message
    });
  }
};

// Trả lời yêu cầu hỗ trợ (Admin)
exports.respondToSupport = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung trả lời không được để trống'
      });
    }

    const support = await Support.findById(req.params.id);

    if (!support) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hỗ trợ'
      });
    }

    support.responses.push({
      message,
      respondedBy: req.user._id,
      timestamp: new Date()
    });

    if (support.status === 'new') {
      support.status = 'in-progress';
    }

    await support.save();
    await support.populate('responses.respondedBy', 'username fullname');

    res.json({
      success: true,
      data: support,
      message: 'Đã gửi phản hồi'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi phản hồi',
      error: err.message
    });
  }
};

// Thống kê hỗ trợ (Admin)
exports.getSupportStats = async (req, res) => {
  try {
    const statusStats = await Support.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Support.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Support.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats,
        categoryStats,
        priorityStats
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
