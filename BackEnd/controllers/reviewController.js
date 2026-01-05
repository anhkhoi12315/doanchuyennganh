const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Tạo review mới
exports.createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, rating, comment, images, orderId } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Kiểm tra user đã review chưa
    const existingReview = await Review.findOne({ 
      product: productId, 
      user: userId 
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }

    // Kiểm tra verified purchase
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        'items.product': productId,
        orderStatus: 'delivered'
      });
      isVerifiedPurchase = !!order;
    }

    const review = new Review({
      product: productId,
      user: userId,
      order: orderId,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase
    });

    await review.save();

    // Cập nhật rating cho sản phẩm
    const reviews = await Review.find({ product: productId, isApproved: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Đánh giá đã được gửi'
    });

  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đánh giá',
      error: err.message
    });
  }
};

// Lấy reviews của sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ 
      product: productId,
      isApproved: true 
    })
    .populate('user', 'username fullname')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Review.countDocuments({ 
      product: productId,
      isApproved: true 
    });

    res.json({
      success: true,
      data: reviews,
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
      message: 'Lỗi lấy đánh giá',
      error: err.message
    });
  }
};

// Cập nhật review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findOne({ 
      _id: id, 
      user: req.user._id 
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (images) review.images = images;

    await review.save();

    // Cập nhật lại rating sản phẩm
    const reviews = await Review.find({ 
      product: review.product, 
      isApproved: true 
    });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(review.product, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    res.json({
      success: true,
      data: review,
      message: 'Cập nhật đánh giá thành công'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật đánh giá',
      error: err.message
    });
  }
};

// Xóa review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({ 
      _id: id, 
      user: req.user._id 
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    // Cập nhật lại rating sản phẩm
    const reviews = await Review.find({ 
      product: productId, 
      isApproved: true 
    });
    
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    res.json({
      success: true,
      message: 'Đã xóa đánh giá'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa đánh giá',
      error: err.message
    });
  }
};

// Like review (helpful)
exports.likeReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    res.json({
      success: true,
      data: review
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi',
      error: err.message
    });
  }
};

// Admin: Duyệt review
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Cập nhật lại rating sản phẩm
    const reviews = await Review.find({ 
      product: review.product, 
      isApproved: true 
    });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(review.product, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    res.json({
      success: true,
      data: review,
      message: isApproved ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi',
      error: err.message
    });
  }
};
