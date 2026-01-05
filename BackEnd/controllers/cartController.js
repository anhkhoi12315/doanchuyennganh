const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Lấy giỏ hàng của user
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price salePrice images stock isActive');
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
      await cart.save();
    }

    // Kiểm tra và loại bỏ sản phẩm không còn active hoặc hết hàng
    let needUpdate = false;
    cart.items = cart.items.filter(item => {
      if (!item.product || !item.product.isActive || item.product.stock === 0) {
        needUpdate = true;
        return false;
      }
      return true;
    });

    if (needUpdate) {
      cart.calculateTotal();
      await cart.save();
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy giỏ hàng',
      error: err.message
    });
  }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm'
      });
    }

    const product = await Product.findById(productId);
    
    if (!product || !product.isActive) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không đủ số lượng trong kho'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    const price = product.salePrice || product.price;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${product.stock} sản phẩm trong kho`
        });
      }
      
      existingItem.quantity = newQuantity;
      existingItem.price = price;
    } else {
      cart.items.push({ 
        product: productId, 
        quantity, 
        price 
      });
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock isActive');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('cartUpdated', cart);
    }

    res.json({
      success: true,
      data: cart,
      message: 'Đã thêm vào giỏ hàng'
    });

  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi thêm vào giỏ hàng', 
      error: err.message 
    });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Giỏ hàng không tồn tại' 
      });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Sản phẩm không có trong giỏ hàng' 
      });
    }

    // Kiểm tra tồn kho
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stock} sản phẩm trong kho`
      });
    }

    item.quantity = quantity;
    item.price = product.salePrice || product.price;
    
    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock isActive');

    res.json({
      success: true,
      data: cart,
      message: 'Đã cập nhật giỏ hàng'
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi cập nhật giỏ hàng',
      error: err.message
    });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Giỏ hàng không tồn tại' 
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock isActive');

    res.json({
      success: true,
      data: cart,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi xóa sản phẩm',
      error: err.message
    });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Đã xóa giỏ hàng'
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi xóa giỏ hàng',
      error: err.message
    });
  }
};

// Merge giỏ hàng (cho trường hợp người dùng thêm hàng khi chưa đăng nhập)
exports.mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Dữ liệu giỏ hàng không hợp lệ' 
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      
      if (!product || !product.isActive) continue;

      const quantity = parseInt(item.quantity || item.qty) || 1;
      const price = product.salePrice || product.price;

      const existingItem = cart.items.find(
        cartItem => cartItem.product.toString() === product._id.toString()
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        existingItem.quantity = Math.min(newQuantity, product.stock);
        existingItem.price = price;
      } else {
        cart.items.push({ 
          product: product._id, 
          quantity: Math.min(quantity, product.stock), 
          price 
        });
      }
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product', 'name price salePrice images stock isActive');

    res.json({
      success: true,
      data: cart,
      message: 'Đã hợp nhất giỏ hàng'
    });

  } catch (err) {
    console.error('Error merging cart:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi hợp nhất giỏ hàng', 
      error: err.message 
    });
  }
};
