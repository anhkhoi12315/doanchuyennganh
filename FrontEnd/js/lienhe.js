// Contact Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form-wrapper');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const address = document.getElementById('address').value.trim();
      const message = document.getElementById('message').value.trim();
      
      // Validate
      if (!name || !phone || !email || !message) {
        alert('⚠️ Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('⚠️ Email không hợp lệ!');
        return;
      }
      
      try {
        const submitBtn = form.querySelector('.contact-form-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Đang gửi...';
        submitBtn.disabled = true;
        
        const response = await fetch(window.api.BASE_URL + '/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            address,
            message,
            subject: 'Liên hệ từ website'
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('✅ Gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
          form.reset();
        } else {
          alert('❌ Gửi thất bại: ' + (data.message || 'Lỗi không xác định'));
        }
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
      } catch (err) {
        console.error('Contact form error:', err);
        alert('❌ Đã xảy ra lỗi khi gửi. Vui lòng thử lại!');
        
        const submitBtn = form.querySelector('.contact-form-submit');
        submitBtn.textContent = 'Gửi';
        submitBtn.disabled = false;
      }
    });
  }
});
