const Banner = require('../models/Banner');
const Product = require('../models/Product');

// Lấy banner đang active (cho user)
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('productIds', 'name slug price salePrice images')
    .sort({ priority: -1, createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tải banner'
    });
  }
};

// Lấy tất cả banner (admin)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .populate('productIds', 'name slug price salePrice images')
      .populate('createdBy', 'username email')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Error fetching all banners:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tải banner'
    });
  }
};

// Tạo banner mới (admin)
exports.createBanner = async (req, res) => {
  try {
    const { title, message, type, productIds, discount, startDate, endDate, priority } = req.body;

    // Validate
    if (!title || !message || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc'
      });
    }

    const banner = new Banner({
      title,
      message,
      type: type || 'sale',
      productIds: productIds || [],
      discount: discount || 0,
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      priority: priority || 0,
      isActive: true,
      createdBy: req.user._id
    });

    await banner.save();

    res.status(201).json({
      success: true,
      banner,
      message: 'Tạo banner thành công'
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo banner'
    });
  }
};

// Cập nhật banner (admin)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const banner = await Banner.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('productIds', 'name slug price salePrice images');

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy banner'
      });
    }

    res.json({
      success: true,
      banner,
      message: 'Cập nhật banner thành công'
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật banner'
    });
  }
};

// Xóa banner (admin)
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy banner'
      });
    }

    res.json({
      success: true,
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa banner'
    });
  }
};

// Toggle active status (admin)
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy banner'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      banner,
      message: `Banner đã ${banner.isActive ? 'bật' : 'tắt'}`
    });
  } catch (error) {
    console.error('Error toggling banner:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi thay đổi trạng thái banner'
    });
  }
};
