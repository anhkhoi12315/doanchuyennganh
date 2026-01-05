require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('./models/Product');
const Category = require('./models/Category');

const SYSTEM_PROMPT = `Bạn là trợ lý AI của KYP Jewelry. Nhiệm vụ: Tư vấn sản phẩm từ danh sách có sẵn, trả lời ngắn gọn (2-3 câu), thân thiện, có emoji.`;

async function testChatbotAI() {
  try {
    console.log('\n=== TEST CHATBOT VOI GEMINI AI + DATABASE ===\n');
    
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Ket noi MongoDB thanh cong');
    
    // Lấy sản phẩm
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name price salePrice category material')
      .limit(10)
      .lean();
    
    console.log(`✓ Lay duoc ${products.length} san pham tu database\n`);
    
    // Tạo danh sách sản phẩm
    let productList = '\n\nSAN PHAM CO SAN:\n';
    products.forEach((p, index) => {
      const finalPrice = p.salePrice || p.price;
      const priceStr = finalPrice.toLocaleString('vi-VN');
      const categoryName = p.category?.name || 'Khac';
      productList += `${index + 1}. ${p.name} - ${priceStr}d - ${categoryName}\n`;
    });
    
    // Câu hỏi test
    const userMessage = "Tôi muốn mua nhẫn giá khoảng 3 triệu";
    console.log(`Khach hoi: "${userMessage}"\n`);
    
    // Tạo prompt đầy đủ
    const fullPrompt = SYSTEM_PROMPT + productList + `\n\nKhach: ${userMessage}\n\nBot:`;
    
    console.log('Dang hoi Gemini AI...\n');
    
    // Gọi Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const result = await axios.post(apiUrl, {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    });
    
    const aiResponse = result.data.candidates[0].content.parts[0].text;
    
    console.log('=== AI TRA LOI ===');
    console.log(aiResponse);
    console.log('\n✓ THANH CONG! Chatbot da tich hop database + AI!\n');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('\nX LOI:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testChatbotAI();
