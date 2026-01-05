const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

// Lấy danh sách sản phẩm với filter, search, pagination
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      sort = '-createdAt',
      category,
      categoryName,
      minPrice,
      maxPrice,
      material,
      style,
      search,
      featured
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Filter by category ID
    if (category) {
      query.category = category;
    }
    
    // Filter by category name
    if (categoryName) {
      const categoryDoc = await Category.findOne({ name: new RegExp(categoryName, 'i') });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by material (support multiple values)
    if (material) {
      const materials = material.split(',').map(m => m.trim());
      if (materials.length > 1) {
        query.material = { $in: materials };
      } else {
        query.material = new RegExp(materials[0], 'i');
      }
    }

    // Filter by style (support multiple values)
    if (style) {
      const styles = style.split(',').map(s => s.trim());
      if (styles.length > 1) {
        query.style = { $in: styles };
      } else {
        query.style = new RegExp(styles[0], 'i');
      }
    }

    // Filter featured products
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Search by text
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products: products,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy danh sách sản phẩm',
      error: err.message 
    });
  }
};

// Lấy chi tiết sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    // Lấy reviews cho sản phẩm
    const reviews = await Review.find({ 
      product: product._id,
      isApproved: true 
    })
    .populate('user', 'username fullname')
    .sort('-createdAt')
    .limit(10);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thông tin sản phẩm',
      error: err.message 
    });
  }
};

// Lấy sản phẩm theo slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    // Lấy reviews cho sản phẩm
    const reviews = await Review.find({ 
      product: product._id,
      isApproved: true 
    })
    .populate('user', 'username fullname')
    .sort('-createdAt')
    .limit(10);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thông tin sản phẩm',
      error: err.message 
    });
  }
};

// Lấy sản phẩm theo slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thông tin sản phẩm',
      error: err.message 
    });
  }
};

// Lấy sản phẩm liên quan
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    // Tìm sản phẩm cùng category hoặc cùng style/material
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { style: product.style },
        { material: product.material }
      ]
    })
    .populate('category', 'name slug')
    .limit(8)
    .sort('-sold');

    res.json({
      success: true,
      data: relatedProducts
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy sản phẩm liên quan',
      error: err.message 
    });
  }
};

// Tạo sản phẩm mới (Admin only)
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with body:', req.body);
    console.log('Images received:', req.body.images);
    console.log('Files received:', req.files);
    
    const productData = {
      ...req.body
    };

    // Nếu có upload file, dùng file paths
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(f => `/image/${f.filename}`);
    }
    // Nếu không có file nhưng có images trong body (URL text), giữ nguyên
    // req.body.images sẽ được giữ từ ...req.body
    
    console.log('Final product data images:', productData.images);

    const product = new Product(productData);
    await product.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('productCreated', product);
    }
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Tạo sản phẩm thành công'
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ 
      success: false,
      message: 'Lỗi tạo sản phẩm', 
      error: err.message 
    });
  }
};

// Cập nhật sản phẩm (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    console.log('Updating product with body:', req.body);
    console.log('Images received:', req.body.images);
    console.log('Files received:', req.files);
    
    const updateData = { ...req.body };
    
    // Nếu có upload file, dùng file paths
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => `/image/${f.filename}`);
    }
    // Nếu không có file nhưng có images trong body (URL text), giữ nguyên
    // req.body.images sẽ được giữ từ ...req.body
    
    console.log('Final update data images:', updateData.images);

    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('productUpdated', product);
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Cập nhật sản phẩm thành công'
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Lỗi cập nhật sản phẩm',
      error: err.message 
    });
  }
};

// Xóa sản phẩm (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('productDeleted', { id: req.params.id });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa sản phẩm thành công'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi xóa sản phẩm',
      error: err.message 
    });
  }
};

// Cập nhật stock sản phẩm (Admin only)
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('stockUpdated', { 
        productId: product._id, 
        stock: product.stock 
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Cập nhật tồn kho thành công'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tồn kho',
      error: err.message
    });
  }
};

// Lấy sản phẩm bán chạy
exports.getBestSellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort('-sold')
      .limit(parseInt(limit));

    res.json({
      success: true,
      products: products,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy sản phẩm bán chạy',
      error: err.message
    });
  }
};

// Lấy sản phẩm mới nhất
exports.getNewArrivals = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy sản phẩm mới',
      error: err.message
    });
  }
};

// Lấy sản phẩm nổi bật
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ 
      isActive: true,
      isFeatured: true 
    })
    .populate('category', 'name slug')
    .sort('-sold')
    .limit(parseInt(limit));

    res.json({
      success: true,
      products: products,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy sản phẩm nổi bật',
      error: err.message
    });
  }
};
