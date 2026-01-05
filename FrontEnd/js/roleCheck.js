/**
 * Role-based Access Control Module
 * Kiểm tra quyền truy cập dựa trên role - VERIFY TỪ DATABASE
 */

(function() {
  const API_BASE = 'http://localhost:5000';
  
  // Lấy thông tin người dùng hiện tại từ localStorage (cache)
  function getCurrentUser() {
    if (window.authSync && window.authSync.getCurrentUser) {
      return window.authSync.getCurrentUser();
    }
    
    try {
      const raw = localStorage.getItem('profile');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Lấy token hiện tại
  function getToken() {
    if (window.api && window.api.getToken) {
      return window.api.getToken();
    }
    return localStorage.getItem('accessToken');
  }

  // Verify user từ database
  async function verifyFromDatabase() {
    const token = getToken();
    console.log('🔐 verifyFromDatabase: token =', token ? 'exists' : 'missing');
    
    if (!token) {
      return { success: false, error: 'No token' };
    }

    try {
      console.log('📡 Calling API:', `${API_BASE}/api/profile/get-profile`);
      const response = await fetch(`${API_BASE}/api/profile/get-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📦 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', errorText);
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      console.log('✅ API response:', data);
      
      // API trả về { message, profile } chứ không phải { success, profile }
      if (data.profile) {
        // Cập nhật localStorage với data mới từ server
        localStorage.setItem('profile', JSON.stringify(data.profile));
        if (window.authSync) {
          window.authSync.updateProfile(data.profile);
        }
        console.log('✅ Verified user:', data.profile.username || data.profile.email, 'role:', data.profile.role);
        return { success: true, user: data.profile };
      }

      console.error('❌ Invalid response format:', data);
      return { success: false, error: 'Invalid response' };
    } catch (error) {
      console.error('❌ Error verifying from database:', error);
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra người dùng đã đăng nhập
  function isLoggedIn() {
    return !!(getToken() && getCurrentUser());
  }

  // Kiểm tra người dùng có role admin
  function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
  }

  // Kiểm tra người dùng có role user
  function isUser() {
    const user = getCurrentUser();
    return user && (user.role === 'user' || user.role === 'admin');
  }

  // Yêu cầu đăng nhập
  function requireLogin(redirectTo = './dangnhap.html') {
    if (!isLoggedIn()) {
      console.warn('Người dùng chưa đăng nhập, chuyển hướng tới:', redirectTo);
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  // Yêu cầu role admin - ASYNC VERSION (verify từ database)
  async function requireAdminAsync(redirectTo = './index.html') {
    const token = getToken();
    if (!token) {
      console.warn('Người dùng chưa đăng nhập');
      window.location.href = './dangnhap.html';
      return false;
    }

    // Verify từ database
    const result = await verifyFromDatabase();
    
    if (!result.success) {
      console.warn('Token không hợp lệ hoặc đã hết hạn:', result.error);
      localStorage.clear();
      window.location.href = './dangnhap.html';
      return false;
    }

    if (result.user.role !== 'admin') {
      console.warn('Người dùng không phải admin');
      alert('Bạn không có quyền truy cập trang này!');
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  // Yêu cầu đăng nhập - ASYNC VERSION (verify từ database)
  async function requireLoginAsync(redirectTo = './dangnhap.html') {
    const token = getToken();
    if (!token) {
      console.warn('Người dùng chưa đăng nhập');
      window.location.href = redirectTo;
      return false;
    }

    // Verify từ database
    const result = await verifyFromDatabase();
    
    if (!result.success) {
      console.warn('Token không hợp lệ hoặc đã hết hạn:', result.error);
      localStorage.clear();
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  // Yêu cầu role admin (DEPRECATED - dùng requireAdminAsync thay thế)
  function requireAdmin(redirectTo = './index.html') {
    console.warn('[DEPRECATED] requireAdmin() - Nên dùng requireAdminAsync()');
    if (!isLoggedIn()) {
      console.warn('Người dùng chưa đăng nhập');
      window.location.href = './dangnhap.html';
      return false;
    }
    
    if (!isAdmin()) {
      console.warn('Người dùng không phải admin, chuyển hướng tới:', redirectTo);
      window.location.href = redirectTo;
      return false;
    }
    
    return true;
  }

  // Kiểm tra quyền truy cập trang admin với thông báo
  function checkAdminPageAccess(statusElementId = 'admin-status') {
    const statusEl = document.getElementById(statusElementId);
    
    function setStatus(text, isError = false) {
      if (!statusEl) return;
      statusEl.innerHTML = text ? `<span style="color:${isError ? '#d00' : '#080'}">${text}</span>` : '';
    }

    // Kiểm tra token
    const token = getToken();
    if (!token) {
      setStatus('Vui lòng đăng nhập để truy cập trang này', true);
      setTimeout(() => window.location.href = './dangnhap.html', 1500);
      return false;
    }

    // Kiểm tra profile
    const user = getCurrentUser();
    if (!user) {
      setStatus('Phiên làm việc đã hết, vui lòng đăng nhập lại', true);
      setTimeout(() => window.location.href = './dangnhap.html', 1500);
      return false;
    }

    // Kiểm tra role admin
    if (user.role !== 'admin') {
      setStatus(`Bạn không có quyền truy cập trang này. Chuyển về trang chủ...`, true);
      setTimeout(() => window.location.href = './index.html', 1500);
      return false;
    }

    // Hiển thị thông báo thành công
    setStatus(`✓ Đăng nhập với: ${user.username || user.email} (Admin)`);
    return true;
  }

  // Kiểm tra quyền truy cập trang người dùng
  function checkUserPageAccess(statusElementId = null) {
    if (!isLoggedIn()) {
      console.warn('Người dùng chưa đăng nhập');
      window.location.href = './dangnhap.html';
      return false;
    }

    if (statusElementId) {
      const statusEl = document.getElementById(statusElementId);
      const user = getCurrentUser();
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#080">✓ Đã đăng nhập: ${user.username || user.email}</span>`;
      }
    }

    return true;
  }

  // Expose API công khai
  window.roleCheck = {
    // Cache-based (localStorage)
    getCurrentUser,
    getToken,
    isLoggedIn,
    isAdmin,
    isUser,
    requireLogin,
    requireAdmin,
    checkAdminPageAccess,
    checkUserPageAccess,
    
    // Database verification (recommended)
    verifyFromDatabase,
    requireAdminAsync,
    requireLoginAsync
  };
})();
