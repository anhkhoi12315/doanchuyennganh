const Category = require('../models/Category');

// Lấy tất cả danh mục
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh mục' });
  }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh mục' });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('categoryCreated', category);
    }
    
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi tạo danh mục', error: err.message });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('categoryUpdated', category);
    }
    
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi cập nhật danh mục' });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await Category.findByIdAndDelete(categoryId);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('categoryDeleted', { id: categoryId });
    }
    
    res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa danh mục' });
  }
};
