const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      notes 
    } = req.body;

    // Kiểm tra items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    // Kiểm tra tồn kho và tính tổng tiền
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Sản phẩm ${item.product} không tồn tại`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ số lượng`
        });
      }

      const price = product.salePrice || product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: price,
        quantity: item.quantity,
        image: product.images[0] || ''
      });
    }

    // Tính phí vận chuyển (có thể custom logic)
    const shippingFee = subtotal >= 500000 ? 0 : 30000; // Free ship từ 500k
    const total = subtotal + shippingFee;

    // Generate unique order number
    const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Tạo đơn hàng
    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      subtotal,
      shippingFee,
      total,
      notes,
      statusHistory: [{
        status: 'pending',
        note: 'Đơn hàng đã được tạo',
        timestamp: new Date()
      }]
    });

    await order.save();

    // Cập nhật stock và sold cho sản phẩm
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          stock: -item.quantity,
          sold: item.quantity 
        }
      });
    }

    // Xóa giỏ hàng sau khi đặt hàng
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], totalPrice: 0 }
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('orderCreated', { orderId: order._id, userId });
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Đặt hàng thành công'
    });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đơn hàng',
      error: err.message
    });
  }
};

// Lấy danh sách đơn hàng của user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: userId };
    if (status) {
      query.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
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
      message: 'Lỗi lấy danh sách đơn hàng',
      error: err.message
    });
  }
};

// Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email phone')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền: user chỉ xem được đơn hàng của mình, admin xem được tất cả
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem đơn hàng này'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin đơn hàng',
      error: err.message
    });
  }
};

// Hủy đơn hàng (User chỉ hủy được khi pending/confirmed)
exports.cancelOrder = async (req, res) => {
  try {
    console.log('Cancel order request - ID:', req.params.id, 'User:', req.user?._id);
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    console.log('Order found:', order._id, 'Status:', order.orderStatus, 'Owner:', order.user);

    // Kiểm tra quyền
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      console.log('Permission denied - User role:', req.user.role, 'Order user:', order.user);
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hủy đơn hàng này'
      });
    }

    // Kiểm tra trạng thái
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      console.log('Invalid status for cancellation:', order.orderStatus);
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này'
      });
    }

    console.log('Restoring stock for', order.items.length, 'items');
    // Hoàn lại stock
    for (const item of order.items) {
      const productId = item.product._id || item.product;
      console.log('Restoring stock for product:', productId, 'Quantity:', item.quantity);
      await Product.findByIdAndUpdate(productId, {
        $inc: { 
          stock: item.quantity,
          sold: -item.quantity 
        }
      });
    }

    // Cập nhật trạng thái
    order.orderStatus = 'cancelled';
    order.cancelReason = (req.body && req.body.reason) || 'Khách hàng hủy đơn';
    order.statusHistory.push({
      status: 'cancelled',
      note: order.cancelReason,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await order.save();
    console.log('Order cancelled successfully:', order._id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', { orderId: order._id, status: 'cancelled' });
    }

    res.json({
      success: true,
      data: order,
      message: 'Đã hủy đơn hàng'
    });

  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi hủy đơn hàng',
      error: err.message
    });
  }
};

// ===== ADMIN FUNCTIONS =====

// Lấy tất cả đơn hàng (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      startDate,
      endDate 
    } = req.query;

    let query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('user', 'username email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
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
      message: 'Lỗi lấy danh sách đơn hàng',
      error: err.message
    });
  }
};

// Cập nhật trạng thái đơn hàng (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Cập nhật trạng thái: ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    // Nếu delivered, cập nhật payment status
    if (status === 'delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', { 
        orderId: order._id, 
        status,
        userId: order.user 
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Cập nhật trạng thái thành công'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái',
      error: err.message
    });
  }
};

// Thống kê đơn hàng (Admin)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Tổng số đơn hàng theo trạng thái
    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: '$orderStatus', 
          count: { $sum: 1 },
          total: { $sum: '$total' }
        } 
      }
    ]);

    // Doanh thu
    const revenueStats = await Order.aggregate([
      { 
        $match: { 
          ...dateFilter,
          orderStatus: { $in: ['delivered', 'shipping'] },
          paymentStatus: 'paid'
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats,
        revenue: revenueStats[0] || { 
          totalRevenue: 0, 
          totalOrders: 0, 
          averageOrderValue: 0 
        }
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
