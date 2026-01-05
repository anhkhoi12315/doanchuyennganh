const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Lấy tất cả đơn hàng (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('user', 'username email fullname phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalOrders = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Error getting all orders:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn hàng',
      error: err.message
    });
  }
};

// Lấy thống kê đơn hàng (Admin)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    
    // Tổng số đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
    
    // Tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { $match: { ...dateQuery, orderStatus: { $in: ['confirmed', 'shipping', 'delivered'] } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Đơn hàng theo ngày (7 ngày gần nhất)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const ordersByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Sản phẩm bán chạy nhất
    const topProducts = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);
    
    // Khách hàng mua nhiều nhất
    const topCustomers = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate user info
    await User.populate(topCustomers, { path: '_id', select: 'username email fullname' });
    
    res.json({
      success: true,
      data: {
        ordersByStatus,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByDay,
        topProducts,
        topCustomers,
        summary: {
          totalOrders: await Order.countDocuments(dateQuery),
          pendingOrders: await Order.countDocuments({ ...dateQuery, orderStatus: 'pending' }),
          confirmedOrders: await Order.countDocuments({ ...dateQuery, orderStatus: 'confirmed' }),
          shippingOrders: await Order.countDocuments({ ...dateQuery, orderStatus: 'shipping' }),
          deliveredOrders: await Order.countDocuments({ ...dateQuery, orderStatus: 'delivered' }),
          cancelledOrders: await Order.countDocuments({ ...dateQuery, orderStatus: 'cancelled' })
        }
      }
    });
  } catch (err) {
    console.error('Error getting order stats:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê đơn hàng',
      error: err.message
    });
  }
};

// Cập nhật trạng thái đơn hàng (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Update order status
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Đơn hàng đã được cập nhật sang ${status}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });
    
    await order.save();
    
    // Emit socket event for realtime update
    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Cập nhật trạng thái đơn hàng thành công'
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái đơn hàng',
      error: err.message
    });
  }
};

// Lấy chi tiết đơn hàng (Admin)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'username email fullname phone address')
      .populate('items.product', 'name images category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Error getting order by ID:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết đơn hàng',
      error: err.message
    });
  }
};

// Xóa đơn hàng (Admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Chỉ cho phép xóa đơn hàng đã hủy hoặc đã giao
    if (!['cancelled', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa đơn hàng đã hủy hoặc đã giao'
      });
    }
    
    await Order.findByIdAndDelete(orderId);
    
    res.json({
      success: true,
      message: 'Xóa đơn hàng thành công'
    });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa đơn hàng',
      error: err.message
    });
  }
};

module.exports = exports;
