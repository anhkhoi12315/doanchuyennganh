/**
 * Authentication Synchronization Module
 * Quản lý trạng thái đăng nhập và đồng bộ dữ liệu trên tất cả các trang
 */

(function() {
  // Events để các trang có thể lắng nghe thay đổi trạng thái đăng nhập
  const authEvents = {
    onLogin: [],
    onLogout: [],
    onProfileUpdate: [],
    onChange: []
  };

  // Lấy thông tin đăng nhập hiện tại
  function getCurrentUser() {
    try {
      const profile = localStorage.getItem('profile');
      const token = localStorage.getItem('accessToken');
      if (profile && token) {
        return JSON.parse(profile);
      }
      return null;
    } catch (err) {
      console.error('Lỗi lấy thông tin người dùng:', err);
      return null;
    }
  }

  // Kiểm tra người dùng đã đăng nhập chưa
  function isLoggedIn() {
    return !!getCurrentUser() && !!localStorage.getItem('accessToken');
  }

  // Lưu thông tin đăng nhập
  function setAuthData(profile, accessToken, refreshToken) {
    if (profile) localStorage.setItem('profile', JSON.stringify(profile));
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    
    // Phát sự kiện thay đổi
    notifyListeners('onLogin', profile);
    notifyListeners('onChange');
    
    // Broadcast cho các tab khác
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('auth-sync');
      channel.postMessage({
        type: 'LOGIN',
        profile: profile,
        timestamp: Date.now()
      });
      channel.close();
    }
  }

  // Xóa thông tin đăng nhập
  function clearAuthData() {
    const hadAuth = isLoggedIn();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('profile');
    
    if (hadAuth) {
      notifyListeners('onLogout');
      notifyListeners('onChange');
      
      // Broadcast cho các tab khác
      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('auth-sync');
        channel.postMessage({
          type: 'LOGOUT',
          timestamp: Date.now()
        });
        channel.close();
      }
    }
  }

  // Cập nhật thông tin người dùng
  function updateProfile(newProfile) {
    localStorage.setItem('profile', JSON.stringify(newProfile));
    notifyListeners('onProfileUpdate', newProfile);
    notifyListeners('onChange');
    
    // Broadcast cho các tab khác
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('auth-sync');
      channel.postMessage({
        type: 'PROFILE_UPDATE',
        profile: newProfile,
        timestamp: Date.now()
      });
      channel.close();
    }
  }

  // Đăng ký lắng nghe sự kiện
  function on(event, callback) {
    if (authEvents[event]) {
      authEvents[event].push(callback);
      return true;
    }
    return false;
  }

  // Hủy lắng nghe sự kiện
  function off(event, callback) {
    if (authEvents[event]) {
      const idx = authEvents[event].indexOf(callback);
      if (idx >= 0) {
        authEvents[event].splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  // Phát sự kiện cho các listeners
  function notifyListeners(event, data) {
    if (authEvents[event]) {
      authEvents[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Lỗi trong callback ${event}:`, err);
        }
      });
    }
  }

  // Lắng nghe sự kiện từ các tab khác
  function initBroadcasting() {
    if (!window.BroadcastChannel) return;

    const channel = new BroadcastChannel('auth-sync');
    channel.addEventListener('message', (event) => {
      const { type, profile } = event.data;
      
      switch (type) {
        case 'LOGIN':
          if (profile && profile.username !== (getCurrentUser() || {}).username) {
            localStorage.setItem('profile', JSON.stringify(profile));
            notifyListeners('onLogin', profile);
            notifyListeners('onChange');
          }
          break;
        case 'LOGOUT':
          if (isLoggedIn()) {
            clearAuthData();
          }
          break;
        case 'PROFILE_UPDATE':
          localStorage.setItem('profile', JSON.stringify(profile));
          notifyListeners('onProfileUpdate', profile);
          notifyListeners('onChange');
          break;
      }
    });

    // Cleanup khi tab đóng
    window.addEventListener('beforeunload', () => {
      channel.close();
    });
  }

  // Khởi tạo khi DOM sẵn sàng
  function init() {
    initBroadcasting();
    
    // Lắng nghe sự kiện storage (từ các tab khác trên cùng origin)
    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken' || event.key === 'profile' || event.key === 'refreshToken') {
        // Có sự thay đổi từ tab khác
        if (!localStorage.getItem('accessToken')) {
          // Người dùng đã đăng xuất ở tab khác
          notifyListeners('onLogout');
        } else if (event.key === 'profile' && event.newValue) {
          // Cập nhật hồ sơ ở tab khác
          try {
            notifyListeners('onProfileUpdate', JSON.parse(event.newValue));
          } catch (err) {}
        }
        notifyListeners('onChange');
      }
    });
  }

  // Expose API toàn cục
  window.authSync = {
    getCurrentUser,
    isLoggedIn,
    setAuthData,
    clearAuthData,
    updateProfile,
    on,
    off,
    init
  };

  // Auto-init khi script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
