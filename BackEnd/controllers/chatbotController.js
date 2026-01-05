const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ChatHistory = require('../models/ChatHistory');

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');

// System prompt cho chatbot trang sức
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của shop trang sức KYP Jewelry.

THÔNG TIN SHOP:
- Tên: KYP Jewelry
- Chuyên: Trang sức cao cấp (nhẫn, dây chuyền, bông tai, vòng tay)
- Giá: 1.5M - 4M VND
- Địa chỉ: Bình Tân, TP.HCM
- Hotline: 0369604155
- Email: kypjewelry@gmail.com

CHÍNH SÁCH:
- Đổi trả: 7 ngày không lý do
- Giao hàng: Miễn phí đơn >500K, 2-5 ngày
- Thanh toán: COD, chuyển khoản, MoMo, VNPay
- Bảo hành: 6 tháng - 1 năm

NHIỆM VỤ:
1. Tư vấn sản phẩm phù hợp với nhu cầu khách từ danh sách có sẵn
2. Giải đáp về giá, chính sách, giao hàng
3. Thân thiện, chuyên nghiệp
4. Khuyến khích khách đặt hàng hoặc liên hệ

QUI TẮC ĐỊNH DẠNG CỰC KỲ QUAN TRỌNG:
- Khi giới thiệu SẢN PHẨM, BẮT BUỘC format như sau:

💎 [Tên sản phẩm]
• Giá: [giá]đ
• Loại: [loại]
• Đặc điểm: [mô tả ngắn]

- Mỗi sản phẩm PHẢI XUỐNG DÒNG riêng
- Dùng emoji phù hợp: 💎 (trang sức), 💰 (giá), ✨ (đặc biệt)
- Câu mở đầu ngắn gọn, thân thiện
- Kết thúc bằng câu hỏi để tương tác
- KHÔNG viết dài dòng, tối đa 3-4 sản phẩm

VÍ DỤ TRẢ LỜI TỐT:
"Chào bạn! Shop có mấy mẫu nhẫn trong tầm giá này đây ạ:

💎 Nhẫn Bạc Ý 925 Đính Đá
• Giá: 1.200.000đ
• Loại: Nhẫn bạc
• Đặc điểm: Thiết kế tinh tế, phù hợp mọi dịp

💎 Nhẫn Vàng Trắng
• Giá: 3.200.000đ 
• Loại: Nhẫn vàng
• Đặc điểm: Sang trọng, phong cách hiện đại

Bạn thích mẫu nào hơn ạ? 😊"`;

// Chat với Gemini
exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập tin nhắn'
      });
    }

    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('❌ GEMINI_API_KEY chưa được cấu hình!');
      return res.status(500).json({
        success: false,
        error: 'Chatbot chưa được cấu hình. Vui lòng liên hệ: 0369604155'
      });
    }

    // Lấy userId từ token (nếu đã đăng nhập)
    const userId = req.user?.id || null;
    
    // Tìm hoặc tạo lịch sử chat theo userId
    let chatHistory;
    if (userId) {
      // Nếu đã đăng nhập, tìm theo userId
      chatHistory = await ChatHistory.findOne({ userId });
      if (!chatHistory) {
        chatHistory = new ChatHistory({
          userId,
          sessionId: `user_${userId}_${Date.now()}`,
          messages: []
        });
      }
    } else {
      // Guest user - tạo session mới (không lưu lâu dài)
      const guestSessionId = `guest_${Date.now()}`;
      chatHistory = new ChatHistory({
        sessionId: guestSessionId,
        messages: []
      });
    }

    // LẤY SẢN PHẨM TỪ DATABASE
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('_id name slug price salePrice category material style stock images')
      .limit(20)
      .lean();

    // Tạo danh sách sản phẩm cho AI
    let productList = '\n\nSẢN PHẨM CÓ SẴN TRONG SHOP:\n';
    products.forEach((p, index) => {
      const finalPrice = p.salePrice || p.price;
      const priceStr = finalPrice.toLocaleString('vi-VN');
      const categoryName = p.category?.name || 'Chưa phân loại';
      productList += `${index + 1}. ${p.name} - ${priceStr}đ - ${categoryName} - Chất liệu: ${p.material} - Phong cách: ${p.style} - Kho: ${p.stock}\n`;
    });

    // Tạo prompt đầy đủ với system instruction và history
    let fullPrompt = SYSTEM_PROMPT + productList + '\n\n';
    
    // Thêm lịch sử hội thoại
    if (conversationHistory.length > 0) {
      fullPrompt += 'LỊCH SỬ HỘI THOẠI:\n';
      conversationHistory.slice(-6).forEach(msg => {
        if (msg.role === 'user') {
          fullPrompt += `Khách: ${msg.content}\n`;
        } else {
          fullPrompt += `Bot: ${msg.content}\n`;
        }
      });
      fullPrompt += '\n';
    }
    
    fullPrompt += `TIN NHẮN MỚI:\nKhách: ${message}\n\nBot:`;

    // Gọi API Gemini 2.5 Flash - Model mới nhất
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const result = await axios.post(apiUrl, {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }]
    });
    
    const text = result.data.candidates[0].content.parts[0].text;

    // Tìm sản phẩm được đề cập trong tin nhắn (nếu có)
    const mentionedProducts = [];
    for (const product of products) {
      if (text.includes(product.name)) {
        mentionedProducts.push({
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.salePrice || product.price,
          originalPrice: product.price,
          image: product.images[0] || '/img/default-product.jpg',
          category: product.category?.name
        });
      }
    }

    // Trả về kết quả
    res.json({
      success: true,
      message: text,
      products: mentionedProducts, // Danh sách sản phẩm được đề cập
      isAuthenticated: !!userId // Cho client biết đã đăng nhập hay chưa
    });

    // Lưu lịch sử chat (async, không block response)
    // CHỈ LƯU NẾU ĐÃ ĐĂNG NHẬP
    if (userId) {
      console.log('💾 Saving chat history for user:', userId);
      chatHistory.messages.push(
        { 
          role: 'user', 
          content: message, 
          timestamp: new Date() 
        },
        { 
          role: 'assistant', 
          content: text, 
          products: mentionedProducts, // Lưu luôn products
          timestamp: new Date() 
        }
      );
      chatHistory.save()
        .then(() => console.log('✅ Chat history saved successfully'))
        .catch(err => console.error('❌ Lỗi lưu chat history:', err));
    } else {
      console.log('ℹ️ Guest user - không lưu lịch sử');
    }

  } catch (error) {
    console.error('❌ Lỗi Gemini AI:', error);
    
    // Trả về thông báo lỗi thân thiện
    res.status(500).json({
      success: false,
      error: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ: 0369604155',
      details: error.message
    });
  }
};

// Lấy gợi ý sản phẩm
exports.getProductSuggestions = async (req, res) => {
  try {
    const { category, budget, occasion } = req.query;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    });

    const prompt = `${SYSTEM_PROMPT}

Gợi ý 3 sản phẩm trang sức phù hợp:
- Loại: ${category || 'bất kỳ'}
- Ngân sách: ${budget || '1.5M-4M VND'}
- Dịp: ${occasion || 'thường ngày'}

Trả lời ngắn gọn, mỗi sản phẩm 1 dòng.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({
      success: true,
      suggestions: text
    });

  } catch (error) {
    console.error('❌ Lỗi gợi ý sản phẩm:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tạo gợi ý'
    });
  }
};

// Lấy lịch sử chat của user (chỉ cho user đã đăng nhập)
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.json({
        success: true,
        messages: [] // Guest không có lịch sử
      });
    }

    const chatHistory = await ChatHistory.findOne({ userId });
    
    res.json({
      success: true,
      messages: chatHistory ? chatHistory.messages : []
    });
  } catch (error) {
    console.error('Lỗi lấy chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy lịch sử chat'
    });
  }
};

// [ADMIN] Lấy tất cả lịch sử chat của tất cả users
exports.getAllChatHistory = async (req, res) => {
  try {
    const chats = await ChatHistory.find()
      .populate('userId', 'username email')
      .sort({ lastActivity: -1 })
      .lean();
    
    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error('Lỗi lấy tất cả chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy lịch sử chat'
    });
  }
};
