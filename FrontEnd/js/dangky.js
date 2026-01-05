//Click dark mode button
function darkFunction() {
    const element = document.body;
    element.classList.toggle("dark-mode");
    // Đổi ảnh marquee chỉ khi bật dark-mode
    const header_bg = document.querySelector(".header background-color");
    const body_bg = document.querySelector("body background-color");
    const outline = document.querySelector(".signin-info border");
    const text1 = document.querySelector(".signin-text color");
    const text2 = document.querySelector(".email-text color");
    const text3 = document.querySelector(".pass-text color");
  }

// Registration + OTP flow
document.addEventListener('DOMContentLoaded', () => {
  const sendOtpBtn = document.querySelector('.button-signup');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const otpSection = document.getElementById('otpSection');

  const fullnameInput = document.getElementById('fullnameInput');
  const emailInput = document.getElementById('emailInput');
  const genderSelect = document.getElementById('genderSelect');
  const phoneInput = document.getElementById('phoneInput');
  const birthdayInput = document.getElementById('birthdayInput');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('usernameInput');
  const otpInput = document.getElementById('otpInput');

  if (!sendOtpBtn) return;

  const API_BASE = 'http://localhost:5000/api';

  sendOtpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    // basic validation
    const fullname = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const gender = genderSelect.value;
    const phone = phoneInput.value.trim();
    const birthday = birthdayInput.value;
    const password = passwordInput.value;
    const username = usernameInput.value.trim();

    if (!fullname || !email || !gender || !birthday || !password || !username) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, fullname, gender, birthday, phone })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Gửi OTP thất bại');
        return;
      }
      alert(data.message || 'OTP đã được gửi. Vui lòng kiểm tra email.');
      otpSection.style.display = 'block';
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server');
    }
  });

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();
      if (!email || !otp) {
        alert('Vui lòng nhập email và mã OTP');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/register-verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Xác thực OTP thất bại');
          return;
        }
        alert(data.message || 'Đăng ký thành công');
        // redirect to login
        window.location.href = './dangnhap.html';
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối tới server');
      }
    });
  }
});