const UserBehavior = require('../models/UserBehavior');
const Product = require('../models/Product');

// Track hành vi người dùng
exports.trackBehavior = async (req, res) => {
  try {
    const { 
      eventType, 
      productId, 
      categoryId, 
      searchQuery, 
      metadata 
    } = req.body;

    const userId = req.user ? req.user._id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
    
    const behaviorData = {
      user: userId,
      sessionId,
      eventType,
      product: productId || null,
      category: categoryId || null,
      searchQuery: searchQuery || null,
      metadata: metadata || {},
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const behavior = new UserBehavior(behaviorData);
    await behavior.save();

    res.json({
      success: true,
      message: 'Đã ghi nhận hành vi'
    });

  } catch (err) {
    console.error('Error tracking behavior:', err);
    // Không trả lỗi 500 để không ảnh hưởng UX
    res.json({
      success: false,
      message: 'Không thể ghi nhận hành vi'
    });
  }
};

// Lấy thống kê hành vi (Admin)
exports.getBehaviorStats = async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;

    let matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    if (eventType) {
      matchQuery.eventType = eventType;
    }

    // Thống kê theo loại event
    const eventStats = await UserBehavior.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Sản phẩm được xem nhiều nhất
    const mostViewedProducts = await UserBehavior.aggregate([
      { 
        $match: { 
          ...matchQuery,
          eventType: 'view',
          product: { $ne: null }
        } 
      },
      {
        $group: {
          _id: '$product',
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }
    ]);

    // Từ khóa tìm kiếm phổ biến
    const topSearches = await UserBehavior.aggregate([
      {
        $match: {
          ...matchQuery,
          eventType: 'search',
          searchQuery: { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$searchQuery',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Category phổ biến
    const topCategories = await UserBehavior.aggregate([
      {
        $match: {
          ...matchQuery,
          category: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' }
    ]);

    // Số lượng user hoạt động
    const activeUsers = await UserBehavior.distinct('user', {
      ...matchQuery,
      user: { $ne: null }
    });

    res.json({
      success: true,
      data: {
        eventStats,
        mostViewedProducts,
        topSearches,
        topCategories,
        activeUsersCount: activeUsers.length
      }
    });

  } catch (err) {
    console.error('Error getting behavior stats:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê hành vi',
      error: err.message
    });
  }
};

// Lấy hành vi của một user cụ thể (Admin hoặc chính user đó)
exports.getUserBehavior = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra quyền
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thông tin này'
      });
    }

    const { page = 1, limit = 50, eventType } = req.query;

    let query = { user: userId };
    if (eventType) {
      query.eventType = eventType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const behaviors = await UserBehavior.find(query)
      .populate('product', 'name images price')
      .populate('category', 'name')
      .sort('-timestamp')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserBehavior.countDocuments(query);

    res.json({
      success: true,
      data: behaviors,
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
      message: 'Lỗi lấy lịch sử hành vi',
      error: err.message
    });
  }
};
