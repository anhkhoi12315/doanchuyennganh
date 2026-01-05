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

// Login handler: intercept click on sign-in button, call backend API
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOMContentLoaded] Script loaded');
    
    //Load slider
    const list = document.querySelector('.slider .list');
    const items = document.querySelectorAll('.slider .list .item');
    const dots = document.querySelectorAll('.slider .dots li');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');

    if (list && items.length && dots.length && prev && next) {
        let active = 0;
        let lengthItems = items.length - 1;

        next.onclick = function(){
            if(active +1 > lengthItems){
                active = 0;
            } else {
                active = active + 1;
            }
            reloadSlider();
        }

        prev.onclick = function(){
            if(active - 1 < 0){
                active = lengthItems;
            } else {
                active = active - 1;
            }
            reloadSlider();
        }

        let refreshSlider = setInterval(()=> {next.click()}, 3000);
        
        function reloadSlider(){
            // Kiểm tra active có lớn hơn hoặc bằng chiều dài của mảng items hay không
            if (active >= items.length) {
                active = 0; // Nếu có, thiết lập active về 0 để quay lại slide đầu tiên
            }
            let checkLeft = items[active].offsetLeft;
            list.style.left = -checkLeft + 'px';

            let lastActiveDot = document.querySelector('.slider .dots li.active');
            if (lastActiveDot) lastActiveDot.classList.remove('active');
            dots[active].classList.add('active');
            clearInterval(refreshSlider);
            refreshSlider = setInterval(()=>{next.click()}, 3000);
        }
        
        dots.forEach((li, key) => {
            li.addEventListener('click', function(){
                active = key;
                reloadSlider();
            })
        })
    }

    // Login form elements
    const signBtn = document.querySelector('.button-signin');
    const usernameInput = document.querySelector('.username-box');
    const passwordInput = document.querySelector('.password-box');

    console.log('[DOMContentLoaded] Elements found:', {
        signBtn: !!signBtn,
        usernameInput: !!usernameInput,
        passwordInput: !!passwordInput
    });

    if (!signBtn || !usernameInput || !passwordInput) {
        console.error('[DOMContentLoaded] Missing elements!');
        alert('Lỗi: Không tìm thấy form đăng nhập. Vui lòng tải lại trang.');
        return;
    }

    console.log('[DOMContentLoaded] Attaching click event...');

    signBtn.addEventListener('click', async (e) => {
        console.log('[Login] Button clicked!');
        
        // Prevent the default anchor navigation if present
        e.preventDefault();
        e.stopPropagation();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        console.log('[Login] Username:', username, 'Password length:', password.length);
        
        // Hiển thị thông báo để người dùng biết là script đang chạy
        console.log('[Login] Starting login process...');
        
        if (!username || !password) {
            alert('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }

        try {
            // Use central api helper if available
            let data;
            console.log('[Login] window.api:', !!window.api, 'window.api.login:', !!(window.api && window.api.login));
            
            if (window.api && window.api.login) {
              console.log('[Login] Sử dụng window.api.login()');
              data = await window.api.login(username, password);
            } else {
              console.log('[Login] Sử dụng fetch trực tiếp');
              const API_BASE = 'http://localhost:5000/api';
              const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
              });
              data = await res.json();
            }

            console.log('[Login] Response:', data);

            if (!data) {
                alert('Không nhận được phản hồi từ server');
                return;
            }

            if (data.message && !data.profile) {
                alert(data.message || 'Đăng nhập thất bại');
                return;
            }

            // Save tokens and profile via authSync
            console.log('[Login] Saving data...');
            if (window.authSync) {
              console.log('[Login] Dùng authSync');
              window.authSync.setAuthData(data.profile, data.accessToken, data.refreshToken);
            } else {
              console.log('[Login] Fallback localStorage');
              // Fallback nếu authSync chưa load
              if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
              if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
              if (data.profile) localStorage.setItem('profile', JSON.stringify(data.profile));
            }

            // Merge local cart into user's cart (if any)
            try {
              const localCart = window.api.getLocalCart && window.api.getLocalCart();
              if (localCart && localCart.length && window.api.mergeCart) {
                console.log('[Login] Merging local cart...');
                await window.api.mergeCart(localCart);
                window.api.clearLocalCart && window.api.clearLocalCart();
              }
            } catch (err) {
              console.warn('Không thể gộp giỏ hàng:', err);
            }

            // Redirect based on role: admins -> admin page; others -> home
            try {
              const profile = data.profile || (window.authSync && window.authSync.getCurrentUser());
              console.log('[Login] Profile:', profile);
              
              if (profile && profile.role === 'admin') {
                console.log('[Login] Redirecting to admin.html');
                window.location.href = './admin.html';
              } else {
                console.log('[Login] Redirecting to index.html');
                window.location.href = './index.html';
              }
            } catch (err) {
              console.error('[Login] Redirect error:', err);
              window.location.href = './index.html';
            }
        } catch (err) {
            console.error('[Login] Error:', err);
            alert('Lỗi kết nối tới server: ' + err.message);
        }
    });
});