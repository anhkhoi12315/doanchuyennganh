const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Lấy wishlist của user
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products.product', 'name price salePrice images stock isActive rating');

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
      await wishlist.save();
    }

    // Lọc sản phẩm không còn active
    wishlist.products = wishlist.products.filter(item => 
      item.product && item.product.isActive
    );

    res.json({
      success: true,
      data: wishlist
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách yêu thích',
      error: err.message
    });
  }
};

// Thêm sản phẩm vào wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Kiểm tra sản phẩm đã có chưa
    const exists = wishlist.products.find(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong danh sách yêu thích'
      });
    }

    wishlist.products.push({ product: productId });
    await wishlist.save();
    await wishlist.populate('products.product', 'name price salePrice images stock isActive rating');

    res.json({
      success: true,
      data: wishlist,
      message: 'Đã thêm vào danh sách yêu thích'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm sản phẩm',
      error: err.message
    });
  }
};

// Xóa sản phẩm khỏi wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Danh sách yêu thích trống'
      });
    }

    wishlist.products = wishlist.products.filter(
      item => item.product.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate('products.product', 'name price salePrice images stock isActive rating');

    res.json({
      success: true,
      data: wishlist,
      message: 'Đã xóa khỏi danh sách yêu thích'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa sản phẩm',
      error: err.message
    });
  }
};

// Kiểm tra sản phẩm có trong wishlist không
exports.checkInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    const isInWishlist = wishlist && wishlist.products.some(
      item => item.product.toString() === productId
    );

    res.json({
      success: true,
      data: { isInWishlist }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra',
      error: err.message
    });
  }
};

// Xóa toàn bộ wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.json({
      success: true,
      message: 'Đã xóa danh sách yêu thích'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa danh sách',
      error: err.message
    });
  }
};
