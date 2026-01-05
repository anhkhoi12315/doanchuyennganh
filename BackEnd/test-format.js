require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('./models/Product');
const Category = require('./models/Category');

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

async function testFormat() {
  try {
    console.log('\n=== TEST CHAT FORMAT MOI ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name price salePrice category material')
      .limit(10)
      .lean();
    
    let productList = '\n\nSAN PHAM CO SAN:\n';
    products.forEach((p, index) => {
      const finalPrice = p.salePrice || p.price;
      const priceStr = finalPrice.toLocaleString('vi-VN');
      const categoryName = p.category?.name || 'Khac';
      productList += `${index + 1}. ${p.name} - ${priceStr}d - ${categoryName}\n`;
    });
    
    const userMessage = "Tôi muốn mua nhẫn giá khoảng 3 triệu";
    console.log(`Khach: "${userMessage}"\n`);
    
    const fullPrompt = SYSTEM_PROMPT + productList + `\n\nKhach: ${userMessage}\n\nBot:`;
    
    console.log('Dang hoi AI...\n');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const result = await axios.post(apiUrl, {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    });
    
    const aiResponse = result.data.candidates[0].content.parts[0].text;
    
    console.log('=== AI TRA LOI (FORMAT MOI) ===');
    console.log(aiResponse);
    console.log('\n');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('X LOI:', error.message);
    process.exit(1);
  }
}

testFormat();
