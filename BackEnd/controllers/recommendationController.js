const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const UserBehavior = require('../models/UserBehavior');

// Lấy tư vấn sản phẩm dựa trên form input
exports.getRecommendations = async (req, res) => {
  try {
    const { age, gender, occasion, style, priceRange, material, recipient } = req.body;
    const userId = req.user ? req.user._id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    // Build query để tìm sản phẩm phù hợp
    let query = { isActive: true };

    // Filter theo chất liệu
    if (material && material.length > 0) {
      query.material = { $in: material };
    }

    // Filter theo style
    if (style && style.length > 0) {
      query.style = { $in: style };
    }

    // Filter theo price range
    if (priceRange) {
      query.price = {};
      if (priceRange.min) query.price.$gte = priceRange.min;
      if (priceRange.max) query.price.$lte = priceRange.max;
    }

    // Lấy sản phẩm
    let products = await Product.find(query)
      .populate('category', 'name slug')
      .sort('-sold')
      .limit(20);

    // Tính score cho mỗi sản phẩm dựa trên các yếu tố
    const scoredProducts = products.map(product => {
      let score = 0;
      let reasons = [];

      // Điểm theo độ phổ biến
      score += product.sold * 0.3;
      
      // Điểm theo rating
      score += product.rating.average * 10;

      // Điểm theo style match
      if (style && style.includes(product.style)) {
        score += 20;
        reasons.push(`Phong cách ${product.style} phù hợp với bạn`);
      }

      // Điểm theo material match
      if (material && material.includes(product.material)) {
        score += 15;
        reasons.push(`Chất liệu ${product.material} theo sở thích`);
      }

      // Điểm theo occasion
      if (occasion === 'wedding' && product.style === 'luxury') {
        score += 25;
        reasons.push('Hoàn hảo cho đám cưới');
      } else if (occasion === 'daily' && product.style === 'minimalist') {
        score += 20;
        reasons.push('Phù hợp đeo hàng ngày');
      } else if (occasion === 'gift') {
        score += 15;
        reasons.push('Món quà ý nghĩa');
      }

      // Điểm theo giới tính và độ tuổi
      if (age) {
        if (age < 25 && product.style === 'modern') {
          score += 10;
          reasons.push('Trẻ trung, hiện đại');
        } else if (age >= 25 && age < 40 && product.style === 'classic') {
          score += 10;
          reasons.push('Thanh lịch, sang trọng');
        } else if (age >= 40 && product.style === 'luxury') {
          score += 10;
          reasons.push('Đẳng cấp, quý phái');
        }
      }

      return {
        product: product._id,
        productData: product,
        score,
        reason: reasons.join(', ') || 'Sản phẩm được đề xuất'
      };
    });

    // Sắp xếp theo score
    scoredProducts.sort((a, b) => b.score - a.score);

    // Lấy top 10
    const topProducts = scoredProducts.slice(0, 10);

    // Lưu recommendation
    const recommendation = new Recommendation({
      user: userId,
      sessionId,
      userInput: {
        age,
        gender,
        occasion,
        style,
        priceRange,
        material,
        recipient
      },
      recommendedProducts: topProducts.map(p => ({
        product: p.product,
        score: p.score,
        reason: p.reason
      }))
    });

    await recommendation.save();

    res.json({
      success: true,
      data: {
        recommendations: topProducts.map(p => ({
          ...p.productData.toObject(),
          recommendationScore: p.score,
          recommendationReason: p.reason
        })),
        recommendationId: recommendation._id
      },
      message: 'Đã tìm thấy sản phẩm phù hợp với bạn'
    });

  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi tư vấn sản phẩm',
      error: err.message
    });
  }
};

// Lấy tư vấn dựa trên lịch sử hành vi
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy hành vi người dùng (xem, tìm kiếm, thêm giỏ hàng)
    const behaviors = await UserBehavior.find({ user: userId })
      .sort('-timestamp')
      .limit(50)
      .populate('product')
      .populate('category');

    if (behaviors.length === 0) {
      // Nếu chưa có hành vi, trả về sản phẩm bán chạy
      const products = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .sort('-sold')
        .limit(10);

      return res.json({
        success: true,
        data: products,
        message: 'Sản phẩm đề xuất cho bạn'
      });
    }

    // Phân tích hành vi
    const viewedProducts = behaviors.filter(b => b.eventType === 'view' && b.product).map(b => b.product);
    const categories = behaviors.filter(b => b.category).map(b => b.category._id);
    
    // Lấy material và style phổ biến từ lịch sử
    const materials = {};
    const styles = {};
    
    viewedProducts.forEach(p => {
      if (p && p.material) materials[p.material] = (materials[p.material] || 0) + 1;
      if (p && p.style) styles[p.style] = (styles[p.style] || 0) + 1;
    });

    const topMaterial = Object.keys(materials).sort((a, b) => materials[b] - materials[a])[0];
    const topStyle = Object.keys(styles).sort((a, b) => styles[b] - styles[a])[0];

    // Tìm sản phẩm tương tự
    let query = {
      isActive: true,
      _id: { $nin: viewedProducts.map(p => p._id) } // Loại bỏ sản phẩm đã xem
    };

    if (categories.length > 0) {
      query.category = { $in: categories };
    }

    if (topMaterial) {
      query.material = topMaterial;
    }

    if (topStyle) {
      query.style = topStyle;
    }

    const recommendedProducts = await Product.find(query)
      .populate('category', 'name slug')
      .sort('-sold')
      .limit(10);

    res.json({
      success: true,
      data: recommendedProducts,
      message: 'Sản phẩm đề xuất dựa trên sở thích của bạn'
    });

  } catch (err) {
    console.error('Error getting personalized recommendations:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy gợi ý cá nhân',
      error: err.message
    });
  }
};

// Chatbot tư vấn dựa trên form (NEW - for chatbot form)
exports.getChatbotRecommendations = async (req, res) => {
  try {
    const { age, gender, occasion, style, budget } = req.body;

    // Build query để tìm sản phẩm phù hợp
    let query = { isActive: true };

    // Filter theo budget (ngân sách)
    if (budget) {
      const budgetNum = parseInt(budget);
      query.price = { 
        $gte: budgetNum * 0.5,  // Tối thiểu 50% ngân sách
        $lte: budgetNum * 1.2   // Tối đa 120% ngân sách
      };
    }

    // Lấy sản phẩm từ database
    let products = await Product.find(query)
      .populate('category', 'name slug')
      .sort('-rating.average -sold')
      .limit(30);

    if (products.length === 0) {
      // Nếu không tìm thấy, lấy sản phẩm bán chạy
      products = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .sort('-sold')
        .limit(10);
    }

    // Tính điểm phù hợp cho mỗi sản phẩm
    const scoredProducts = products.map(product => {
      let score = 0;
      let reasons = [];

      // Điểm cơ bản từ rating và sold
      score += product.rating.average * 10;
      score += Math.min(product.sold * 0.2, 50);

      // Điểm theo phong cách
      const styleMapping = {
        'classic': ['classic', 'traditional'],
        'modern': ['modern', 'contemporary'],
        'minimalist': ['minimalist', 'simple'],
        'luxury': ['luxury', 'premium', 'elegant'],
        'vintage': ['vintage', 'retro']
      };

      if (style && styleMapping[style]) {
        const matchedStyles = styleMapping[style];
        if (product.style && matchedStyles.includes(product.style.toLowerCase())) {
          score += 30;
          reasons.push(`Phong cách ${style} phù hợp`);
        }
      }

      // Điểm theo dịp
      if (occasion) {
        if (occasion === 'wedding' && (product.category.name.includes('Nhẫn') || product.name.toLowerCase().includes('cưới'))) {
          score += 40;
          reasons.push('Hoàn hảo cho đám cưới');
        } else if (occasion === 'birthday' && product.category.name.includes('Dây chuyền')) {
          score += 30;
          reasons.push('Quà sinh nhật ý nghĩa');
        } else if (occasion === 'anniversary') {
          score += 25;
          reasons.push('Kỷ niệm đáng nhớ');
        } else if (occasion === 'graduation') {
          score += 20;
          reasons.push('Món quà tốt nghiệp');
        } else if (occasion === 'daily') {
          score += 15;
          reasons.push('Phù hợp đeo hàng ngày');
        }
      }

      // Điểm theo tuổi và giới tính
      if (age) {
        const ageNum = parseInt(age);
        if (ageNum < 25) {
          if (product.style === 'modern' || product.style === 'minimalist') {
            score += 15;
            reasons.push('Trẻ trung, năng động');
          }
        } else if (ageNum >= 25 && ageNum < 40) {
          if (product.style === 'classic' || product.style === 'elegant') {
            score += 15;
            reasons.push('Thanh lịch, chuyên nghiệp');
          }
        } else if (ageNum >= 40) {
          if (product.style === 'luxury' || product.style === 'classic') {
            score += 15;
            reasons.push('Đẳng cấp, sang trọng');
          }
        }
      }

      if (gender) {
        if (gender === 'female' && product.category.name.includes('Bông tai')) {
          score += 10;
        } else if (gender === 'male' && product.category.name.includes('Nhẫn')) {
          score += 10;
        }
      }

      // Điểm theo khoảng giá phù hợp với ngân sách
      if (budget) {
        const budgetNum = parseInt(budget);
        const priceRatio = product.price / budgetNum;
        if (priceRatio >= 0.8 && priceRatio <= 1.0) {
          score += 20;
          reasons.push('Giá phù hợp với ngân sách');
        } else if (priceRatio >= 0.6 && priceRatio < 0.8) {
          score += 15;
          reasons.push('Giá tốt, tiết kiệm');
        }
      }

      return {
        product: product._id,
        productData: product,
        score,
        reason: reasons.length > 0 ? reasons.join(' • ') : 'Sản phẩm chất lượng cao'
      };
    });

    // Sắp xếp theo điểm
    scoredProducts.sort((a, b) => b.score - a.score);

    // Lấy top 6 sản phẩm tốt nhất
    const topProducts = scoredProducts.slice(0, 6);

    // Trả về kết quả
    res.json({
      success: true,
      data: topProducts.map(p => ({
        _id: p.productData._id,
        name: p.productData.name,
        price: p.productData.price,
        images: p.productData.images,
        rating: p.productData.rating,
        sold: p.productData.sold,
        category: p.productData.category,
        recommendationScore: Math.round(p.score),
        recommendationReason: p.reason
      })),
      message: `Tìm thấy ${topProducts.length} sản phẩm phù hợp với bạn!`
    });

  } catch (err) {
    console.error('Error in chatbot recommendations:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tư vấn sản phẩm',
      error: err.message
    });
  }
};

// Chatbot trả lời câu hỏi đơn giản
exports.chatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    let response = '';
    let suggestedProducts = [];

    // Rule-based chatbot đơn giản
    if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
      response = 'Trang sức của chúng tôi có giá từ 500,000đ đến 50,000,000đ. Bạn quan tâm đến mức giá nào?';
    } 
    else if (lowerMessage.includes('vàng') || lowerMessage.includes('gold')) {
      response = 'Chúng tôi có nhiều sản phẩm vàng cao cấp. Để tôi tìm cho bạn nhé!';
      suggestedProducts = await Product.find({ 
        material: 'gold', 
        isActive: true 
      }).limit(5);
    }
    else if (lowerMessage.includes('bạc') || lowerMessage.includes('silver')) {
      response = 'Trang sức bạc rất được ưa chuộng! Đây là một số sản phẩm bạc đẹp nhất của chúng tôi:';
      suggestedProducts = await Product.find({ 
        material: 'silver', 
        isActive: true 
      }).limit(5);
    }
    else if (lowerMessage.includes('kim cương') || lowerMessage.includes('diamond')) {
      response = 'Sản phẩm kim cương của chúng tôi rất sang trọng và quý giá:';
      suggestedProducts = await Product.find({ 
        material: 'diamond', 
        isActive: true 
      }).limit(5);
    }
    else if (lowerMessage.includes('cưới') || lowerMessage.includes('wedding')) {
      response = 'Chúc mừng! Đây là những sản phẩm hoàn hảo cho đám cưới:';
      suggestedProducts = await Product.find({ 
        style: 'luxury', 
        isActive: true 
      }).sort('-sold').limit(5);
    }
    else if (lowerMessage.includes('quà') || lowerMessage.includes('gift')) {
      response = 'Tuyệt vời! Đây là những món quà trang sức ý nghĩa:';
      suggestedProducts = await Product.find({ 
        isActive: true 
      }).sort('-sold').limit(5);
    }
    else if (lowerMessage.includes('rẻ') || lowerMessage.includes('giá tốt')) {
      response = 'Đây là những sản phẩm có giá tốt nhất:';
      suggestedProducts = await Product.find({ 
        isActive: true,
        price: { $lte: 2000000 }
      }).sort('price').limit(5);
    }
    else if (lowerMessage.includes('mới') || lowerMessage.includes('new')) {
      response = 'Đây là những sản phẩm mới nhất của chúng tôi:';
      suggestedProducts = await Product.find({ 
        isActive: true 
      }).sort('-createdAt').limit(5);
    }
    else if (lowerMessage.includes('bán chạy') || lowerMessage.includes('phổ biến')) {
      response = 'Đây là những sản phẩm bán chạy nhất:';
      suggestedProducts = await Product.find({ 
        isActive: true 
      }).sort('-sold').limit(5);
    }
    else {
      response = 'Xin chào! Tôi có thể giúp bạn tìm trang sức phù hợp. Bạn đang tìm loại trang sức nào? (vàng, bạc, kim cương, hay cho dịp đặc biệt nào?)';
    }

    res.json({
      success: true,
      data: {
        message: response,
        products: suggestedProducts
      }
    });

  } catch (err) {
    console.error('Error in chatbot:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi chatbot',
      error: err.message
    });
  }
};
