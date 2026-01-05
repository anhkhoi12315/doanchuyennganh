// Click hambergur menu
function burgerFunction() {
    const overlay = document.querySelector(".menu-overlay");
    const menuDrawer = document.querySelector(".menu-drawer");
    overlay.classList.toggle("active");
    menuDrawer.classList.toggle("active");
  }
  
  
  //Click dark mode button
  function darkFunction() {
    const element = document.body;
    element.classList.toggle("dark-mode");
  }
  
  //Ẩn hiện nội dung câu hỏi FAQ
  document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
  
    if (answer.style.display === 'none' || !answer.style.display) {
    answer.style.display = 'block';
         } else {
         answer.style.display = 'none';
         }
        });
      });
    });
  //Chuyển đổi icon + sang - khi click vào câu hỏi
  document.addEventListener("DOMContentLoaded", function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
  
    faqQuestions.forEach(question => {
        const faqIcon = question.querySelector('.faq-icon');
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            if (answer.style.display === 'none' || !answer.style.display) {
                faqIcon.src = "./icon/hotro-add.svg";
            } else {
                faqIcon.src = "./icon/hotro-minus.svg";
            }
        });
    });
});

// ===== FORMAT BUDGET INPUT =====
document.addEventListener('DOMContentLoaded', function() {
  const budgetInput = document.getElementById('chat-budget');
  
  if (budgetInput) {
    budgetInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, ''); // Chỉ giữ số
      if (value) {
        e.target.value = parseInt(value).toLocaleString('vi-VN');
      }
    });
  }
});

// ===== CHATBOT RECOMMENDATION =====
async function getChatbotRecommendations() {
  const age = document.getElementById('chat-age').value;
  const gender = document.getElementById('chat-gender').value;
  const occasion = document.getElementById('chat-occasion').value;
  const style = document.getElementById('chat-style').value;
  const budgetRaw = document.getElementById('chat-budget').value;

  const resultsDiv = document.getElementById('chatbot-results');

  // Validate
  if (!age || !gender || !occasion || !style || !budgetRaw) {
    resultsDiv.innerHTML = '<div style="background:#fff3cd;color:#856404;padding:20px;border-radius:10px;text-align:center;font-weight:600;box-shadow:0 4px 10px rgba(0,0,0,0.1);">⚠️ Vui lòng điền đầy đủ thông tin để nhận gợi ý tốt nhất!</div>';
    return;
  }

  // Bỏ dấu chấm để gửi số nguyên
  const budget = budgetRaw.replace(/\./g, '');

  try {
    resultsDiv.innerHTML = `
      <div style="text-align:center;padding:60px 20px;background:white;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
        <div style="display:inline-block;width:80px;height:80px;border:6px solid #f3f3f3;border-top:6px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;font-size:18px;color:#666;font-weight:600;">Đang phân tích và tìm sản phẩm phù hợp nhất...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    const response = await fetch(window.api.BASE_URL + '/recommendations/chatbot-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age, gender, occasion, style, budget })
    });

    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      resultsDiv.innerHTML = `
        <div style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,0.15);">
          <div style="font-size:64px;margin-bottom:15px;">😔</div>
          <h3 style="font-size:24px;margin-bottom:10px;">Không tìm thấy sản phẩm phù hợp</h3>
          <p>Hãy thử thay đổi ngân sách hoặc phong cách để xem thêm lựa chọn!</p>
        </div>
      `;
      return;
    }

    const products = data.data;

    resultsDiv.innerHTML = `
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:12px;text-align:center;margin-bottom:30px;box-shadow:0 6px 20px rgba(102,126,234,0.3);">
        <h3 style="color:white;font-size:28px;margin-bottom:10px;">✨ ${data.message}</h3>
        <p style="color:#f0f0f0;font-size:16px;">Các sản phẩm được chọn dựa trên sở thích và ngân sách của bạn</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:25px;">
        ${products.map(product => {
          const imageUrl = product.images && product.images.length > 0 
            ? `${window.api.BASE_URL}${product.images[0]}`
            : `${window.api.BASE_URL}/image/placeholder.jpg`;
          
          return `
            <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);transition:all 0.3s;position:relative;" onmouseover="this.style.transform='translateY(-8px)';this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'">
              ${product.recommendationScore > 80 ? '<div style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;z-index:10;">⭐ Phù hợp nhất</div>' : ''}
              <a href="sanpham.html?id=${product._id}" style="text-decoration:none;color:inherit;">
                <div style="position:relative;overflow:hidden;height:280px;background:#f8f8f8;">
                  <img src="${imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" />
                </div>
                <div style="padding:20px;">
                  <h4 style="font-size:17px;font-weight:700;margin-bottom:8px;min-height:48px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:#1a162e;">${product.name}</h4>
                  
                  ${product.recommendationReason ? `
                    <div style="background:#f0f0ff;color:#667eea;padding:8px 12px;border-radius:8px;font-size:13px;margin-bottom:12px;font-weight:600;">
                      💡 ${product.recommendationReason}
                    </div>
                  ` : ''}
                  
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:4px;">
                      <span style="color:#ffc107;font-size:14px;">⭐</span>
                      <span style="font-size:14px;font-weight:600;">${product.rating?.average || 5}</span>
                    </div>
                    <span style="color:#ccc;">•</span>
                    <span style="font-size:13px;color:#999;">Đã bán ${product.sold || 0}</span>
                  </div>
                  
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <div>
                      <span style="font-size:20px;font-weight:800;color:#667eea;">${product.price?.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                  
                  <button onclick="event.preventDefault(); addToCartFromChatbot('${product._id}')" style="width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;transition:all 0.3s;font-size:15px;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 15px rgba(102,126,234,0.4)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">
                    🛒 Thêm vào giỏ hàng
                  </button>
                </div>
              </a>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Chatbot error:', err);
    resultsDiv.innerHTML = `
      <div style="background:#ff6b6b;color:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 6px 20px rgba(255,107,107,0.3);">
        <div style="font-size:64px;margin-bottom:15px;">❌</div>
        <h3 style="font-size:24px;margin-bottom:10px;">Đã xảy ra lỗi</h3>
        <p style="font-size:16px;">Vui lòng thử lại sau hoặc liên hệ hỗ trợ!</p>
      </div>
    `;
  }
}

async function addToCartFromChatbot(productId) {
  try {
    if (!window.api.isLoggedIn()) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      window.location.href = 'dangnhap.html';
      return;
    }

    await window.api.addToCart(productId, 1);
    alert('✅ Đã thêm vào giỏ hàng!');
  } catch (err) {
    console.error('Add to cart error:', err);
    alert('❌ Không thể thêm vào giỏ hàng');
  }
}
  
  
  
  
  