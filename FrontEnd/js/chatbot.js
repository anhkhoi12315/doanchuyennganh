// AI Chatbot for KYP Jewelry
class JewelryChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isLoading = false;
    this.historyLoaded = false; // Flag để tránh load lại nhiều lần
    this.init();
  }

  // Lấy token từ localStorage
  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  // Kiểm tra user đã đăng nhập chưa
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  async init() {
    this.createChatbotUI();
    this.attachEventListeners();
    
    // Load lịch sử nếu đã đăng nhập
    if (this.isAuthenticated()) {
      await this.loadChatHistory();
    } else {
      this.showWelcomeMessage();
    }
  }

  // Load lịch sử chat từ server (chỉ cho user đã login)
  async loadChatHistory() {
    if (this.isLoading) {
      console.log('⏳ Đang load history...');
      return;
    }

    try {
      this.isLoading = true;
      
      // Verify token từ database trước
      if (window.roleCheck && window.roleCheck.verifyFromDatabase) {
        console.log('🔐 Verifying token từ database...');
        const verification = await window.roleCheck.verifyFromDatabase();
        
        if (!verification.success) {
          console.log('❌ Token không hợp lệ:', verification.error);
          this.showWelcomeMessage();
          return;
        }
        
        console.log('✅ Token hợp lệ, user:', verification.user.username || verification.user.email);
      }
      
      const token = this.getAuthToken();
      console.log('🔐 Loading chat history từ server...');
      
      const response = await fetch('http://localhost:5000/api/chatbot/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📦 Server response:', data);
      
      if (data.success && data.messages && data.messages.length > 0) {
        // Clear messages container trước
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';
        
        // Hiển thị lịch sử chat
        this.messages = data.messages; // Lưu vào array để giữ context
        console.log(`✅ Đã load ${data.messages.length} tin nhắn từ server`);
        
        data.messages.forEach(msg => {
          if (msg.role === 'user') {
            this.addMessage(msg.content, 'user', false);
          } else {
            this.addMessage(msg.content, 'bot', false);
            // Hiển thị products nếu có
            if (msg.products && msg.products.length > 0) {
              console.log('📦 Restoring products from history:', msg.products);
              this.addProductCards(msg.products);
            }
          }
        });
        
        this.scrollToBottom();
        this.historyLoaded = true; // Đánh dấu đã load xong
      } else {
        // Không có lịch sử -> hiển thị welcome (chỉ 1 lần)
        console.log('ℹ️ Không có lịch sử chat - hiển thị welcome');
        if (!this.historyLoaded) {
          this.showWelcomeMessage();
          this.historyLoaded = true;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi load lịch sử chat:', error);
      this.showWelcomeMessage();
    } finally {
      this.isLoading = false;
    }
  }

  createChatbotUI() {
    const chatbotHTML = `
      <div class="chatbot-container">
        <button class="chatbot-button" id="chatbot-toggle">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
          <span class="notification-dot"></span>
        </button>

        <div class="chatbot-window" id="chatbot-window">
          <div class="chatbot-header">
            <div class="chatbot-header-info">
              <div class="chatbot-avatar">💎</div>
              <div class="chatbot-title">
                <h3>KYP Assistant</h3>
                <p>Tư vấn viên trang sức</p>
              </div>
            </div>
            <button class="chatbot-close" id="chatbot-close">×</button>
          </div>

          <div class="chatbot-messages" id="chatbot-messages"></div>

          <div class="chatbot-input-container">
            <input 
              type="text" 
              class="chatbot-input" 
              id="chatbot-input" 
              placeholder="Nhập câu hỏi của bạn..."
              autocomplete="off"
            />
            <button class="chatbot-send-btn" id="chatbot-send">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');

    toggleBtn.addEventListener('click', () => this.toggleChat());
    closeBtn.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chatbot-window');
    const notificationDot = document.querySelector('.notification-dot');
    
    window.classList.toggle('active');
    
    if (this.isOpen) {
      console.log('🔵 Chatbot opened');
      // CHỈ load lịch sử 1 lần khi mở lần đầu
      if (this.isAuthenticated() && !this.historyLoaded) {
        console.log('📥 Loading chat history (first time)...');
        this.loadChatHistory();
      }
      
      if (notificationDot) {
        notificationDot.style.display = 'none';
      }
    }
  }

  showWelcomeMessage() {
    setTimeout(() => {
      this.addBotMessage(
        "Xin chào! 👋 Tôi là trợ lý ảo của KYP Jewelry. Tôi có thể giúp gì cho bạn hôm nay?",
        [
          "Xem sản phẩm mới",
          "Chính sách đổi trả",
          "Tư vấn chọn trang sức",
          "Thông tin giao hàng"
        ]
      );
    }, 1000);
  }

  addMessage(text, sender = 'bot', shouldScroll = true) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    if (sender === 'bot') {
      const messageHTML = `
        <div class="message bot">
          <div class="message-avatar">💎</div>
          <div>
            <div class="message-content">${text}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    } else {
      const messageHTML = `
        <div class="message user">
          <div class="message-avatar">👤</div>
          <div>
            <div class="message-content">${text}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    }
    
    if (shouldScroll) {
      this.scrollToBottom();
    }
  }

  addBotMessage(text, quickReplies = []) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    let quickRepliesHTML = '';
    if (quickReplies.length > 0) {
      quickRepliesHTML = `
        <div class="quick-replies">
          ${quickReplies.map(reply => 
            `<button class="quick-reply-btn" onclick="chatbot.handleQuickReply('${reply}')">${reply}</button>`
          ).join('')}
        </div>
      `;
    }

    const messageHTML = `
      <div class="message bot">
        <div class="message-avatar">💎</div>
        <div>
          <div class="message-content">${text}</div>
          ${quickRepliesHTML}
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    this.scrollToBottom();
  }

  addUserMessage(text) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const messageHTML = `
      <div class="message user">
        <div class="message-avatar">👤</div>
        <div>
          <div class="message-content">${text}</div>
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingHTML = `
      <div class="message bot typing-indicator-wrapper">
        <div class="message-avatar">💎</div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typing = document.querySelector('.typing-indicator-wrapper');
    if (typing) typing.remove();
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    this.messages.push({ role: 'user', content: message });
    input.value = '';

    this.showTypingIndicator();

    try {
      const token = this.getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Thêm token vào header nếu đã đăng nhập
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Gọi API Gemini
      const response = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: message,
          conversationHistory: this.messages.slice(-10) // Chỉ gửi 10 tin nhắn gần nhất
        })
      });

      const data = await response.json();
      
      this.removeTypingIndicator();

      if (data.success) {
        this.messages.push({ role: 'assistant', content: data.message });
        this.addBotMessage(data.message);
        
        // Hiển thị product cards nếu có
        if (data.products && data.products.length > 0) {
          this.addProductCards(data.products);
        }
      } else {
        // Fallback về câu trả lời cứng nếu API lỗi
        const fallbackResponse = this.getResponse(message);
        this.addBotMessage(fallbackResponse.text, fallbackResponse.quickReplies);
      }
    } catch (error) {
      console.error('Lỗi kết nối chatbot:', error);
      this.removeTypingIndicator();
      
      // Fallback về câu trả lời cứng
      const fallbackResponse = this.getResponse(message);
      this.addBotMessage(fallbackResponse.text, fallbackResponse.quickReplies);
    }
  }

  async handleQuickReply(reply) {
    this.addUserMessage(reply);
    this.messages.push({ role: 'user', content: reply });
    this.showTypingIndicator();

    try {
      const response = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: reply,
          conversationHistory: this.messages.slice(-10)
        })
      });

      const data = await response.json();
      
      this.removeTypingIndicator();

      if (data.success) {
        this.messages.push({ role: 'assistant', content: data.message });
        this.addBotMessage(data.message);
        
        // Hiển thị product cards nếu có
        if (data.products && data.products.length > 0) {
          this.addProductCards(data.products);
        }
      } else {
        const fallbackResponse = this.getResponse(reply);
        this.addBotMessage(fallbackResponse.text, fallbackResponse.quickReplies);
      }
    } catch (error) {
      console.error('Lỗi kết nối chatbot:', error);
      this.removeTypingIndicator();
      const fallbackResponse = this.getResponse(reply);
      this.addBotMessage(fallbackResponse.text, fallbackResponse.quickReplies);
    }
  }

  getResponse(message) {
    const msg = message.toLowerCase();

    // Sản phẩm
    if (msg.includes('sản phẩm') || msg.includes('xem') || msg.includes('mới')) {
      return {
        text: "🛍️ Chúng tôi có nhiều dòng sản phẩm:\n\n• Nhẫn kim cương\n• Dây chuyền vàng\n• Bông tai cao cấp\n• Lắc tay sang trọng\n\nBạn muốn xem loại trang sức nào?",
        quickReplies: ["Nhẫn", "Dây chuyền", "Bông tai", "Xem tất cả"]
      };
    }

    // Giá cả
    if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('tiền')) {
      return {
        text: "💰 Giá sản phẩm của chúng tôi:\n\n• Nhẫn: từ 2.000.000đ\n• Dây chuyền: từ 3.500.000đ\n• Bông tai: từ 1.500.000đ\n• Lắc tay: từ 4.000.000đ\n\nChúng tôi thường có chương trình khuyến mãi, bạn có thể xem chi tiết tại trang sản phẩm!",
        quickReplies: ["Xem khuyến mãi", "Tư vấn chọn sản phẩm"]
      };
    }

    // Đổi trả
    if (msg.includes('đổi') || msg.includes('trả') || msg.includes('hoàn')) {
      return {
        text: "🔄 Chính sách đổi trả:\n\n• Đổi trả trong 7 ngày\n• Sản phẩm còn nguyên vẹn\n• Có hóa đơn mua hàng\n• Miễn phí đổi size nhẫn\n\nBạn cần hỗ trợ gì thêm về đổi trả?",
        quickReplies: ["Cách đổi size", "Điều kiện hoàn tiền", "Liên hệ hỗ trợ"]
      };
    }

    // Giao hàng
    if (msg.includes('giao') || msg.includes('ship') || msg.includes('vận chuyển')) {
      return {
        text: "🚚 Thông tin giao hàng:\n\n• Miễn phí ship đơn >500k\n• Giao hàng toàn quốc\n• Thời gian: 2-5 ngày\n• Thanh toán khi nhận hàng\n• Kiểm tra hàng trước khi thanh toán",
        quickReplies: ["Phí ship", "Thời gian giao", "Đặt hàng ngay"]
      };
    }

    // Thanh toán
    if (msg.includes('thanh toán') || msg.includes('payment') || msg.includes('chuyển khoản')) {
      return {
        text: "💳 Phương thức thanh toán:\n\n• COD (Thanh toán khi nhận hàng)\n• Chuyển khoản ngân hàng\n• MoMo\n• VNPay\n\nTất cả đều được hỗ trợ QR code để thanh toán nhanh chóng!",
        quickReplies: ["Hướng dẫn thanh toán", "Đặt hàng ngay"]
      };
    }

    // Tư vấn
    if (msg.includes('tư vấn') || msg.includes('chọn') || msg.includes('nên')) {
      return {
        text: "💎 Tôi có thể tư vấn cho bạn:\n\n• Chọn trang sức phù hợp với phong cách\n• Chọn size nhẫn đúng\n• Chọn kim cương chất lượng\n• Chọn quà tặng ý nghĩa\n\nBạn cần tư vấn gì cụ thể?",
        quickReplies: ["Chọn nhẫn cưới", "Quà tặng sinh nhật", "Size nhẫn"]
      };
    }

    // Liên hệ
    if (msg.includes('liên hệ') || msg.includes('hotline') || msg.includes('số điện thoại')) {
      return {
        text: "📞 Thông tin liên hệ:\n\n• Hotline: 0369 604 155\n• Email: kypjewelry@gmail.com\n• Địa chỉ: Bình Tân, TP.HCM\n• Giờ làm việc: 8:00 - 22:00\n\nBạn có thể liên hệ bất cứ lúc nào!",
        quickReplies: ["Gọi ngay", "Xem bản đồ", "Gửi email"]
      };
    }

    // Default response
    return {
      text: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. 🤔\n\nBạn có thể hỏi tôi về:\n\n• Sản phẩm và giá cả\n• Chính sách đổi trả\n• Thông tin giao hàng\n• Phương thức thanh toán\n• Tư vấn chọn trang sức\n\nHoặc liên hệ hotline: 0369604155 để được hỗ trợ trực tiếp!",
      quickReplies: ["Xem sản phẩm", "Chính sách", "Liên hệ"]
    };
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addProductCards(products) {
    if (!products || products.length === 0) {
      console.log('⚠️ No products to display');
      return;
    }
    
    console.log('📦 Adding product cards:', products);
    const messagesContainer = document.getElementById('chatbot-messages');
    
    const cardsHTML = `
      <div class="chatbot-product-cards">
        ${products.map(product => {
          // Đảm bảo có ID hoặc slug để link
          const productLink = product.slug 
            ? `./sanpham.html?slug=${product.slug}` 
            : (product.id ? `./sanpham.html?id=${product.id}` : '#');
          
          console.log('Product link:', productLink, 'for', product.name);
          
          return `
            <a href="${productLink}" target="_blank" class="chatbot-product-card" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
              <div class="product-card-image">
                <img src="${product.image || './img/default-product.jpg'}" alt="${product.name}" onerror="this.src='./img/default-product.jpg'">
              </div>
              <div class="product-card-info">
                <h4>${product.name}</h4>
                <p class="product-card-category">${product.category || 'Trang sức'}</p>
                <div class="product-card-price">
                  ${product.originalPrice && product.originalPrice !== product.price ? 
                    `<span class="original-price">${product.originalPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                  <span class="sale-price">${product.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <button class="product-card-btn" style="pointer-events: none;">Xem chi tiết →</button>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', cardsHTML);
    this.scrollToBottom();
  }
}

// Initialize chatbot when page loads
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
  chatbot = new JewelryChatbot();
});
