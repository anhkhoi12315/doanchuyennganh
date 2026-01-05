// ===== ADMIN USERS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('tab-users')) {
    await loadUsers();
    setupUserSearch();
  }
});

async function loadUsers(search = '', page = 1) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  
  try {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">⏳ Đang tải...</td></tr>';
    
    let url = `/admin/users?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await window.api.authFetch(url);
    const users = response.data || [];
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">Không tìm thấy người dùng</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr>
        <td><strong>${user.fullname || user.username || 'N/A'}</strong></td>
        <td>${user.email}</td>
        <td>${renderRole(user.role)}</td>
        <td>${user.isActive ? '<span style="color:#27ae60;">✅ Hoạt động</span>' : '<span style="color:#e74c3c;">❌ Khóa</span>'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
        <td>
          <button class="btn toggle-status-btn" data-id="${user._id}" data-active="${user.isActive}" style="background:${user.isActive ? '#e74c3c' : '#27ae60'};padding:6px 12px;font-size:12px;">
            ${user.isActive ? '🔒 Khóa' : '🔓 Mở'}
          </button>
          ${user.role !== 'admin' ? `<button class="btn change-role-btn" data-id="${user._id}" data-role="${user.role}" style="background:#3498db;padding:6px 12px;font-size:12px;margin-left:5px;">
            ${user.role === 'admin' ? '👤 User' : '👑 Admin'}
          </button>` : ''}
        </td>
      </tr>
    `).join('');
    
    // Attach handlers
    tbody.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-id');
        try {
          await window.api.authFetch(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
          alert('✅ Đã cập nhật trạng thái!');
          loadUsers(document.getElementById('user-search')?.value || '');
        } catch (err) {
          alert('❌ Lỗi: ' + err.message);
        }
      });
    });
    
    tbody.querySelectorAll('.change-role-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-id');
        const currentRole = btn.getAttribute('data-role');
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        if (!confirm(`Chuyển vai trò thành ${newRole}?`)) return;
        
        try {
          await window.api.authFetch(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
          });
          alert('✅ Đã thay đổi vai trò!');
          loadUsers(document.getElementById('user-search')?.value || '');
        } catch (err) {
          alert('❌ Lỗi: ' + err.message);
        }
      });
    });
    
  } catch (err) {
    console.error('Error loading users:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#e74c3c;">❌ Không thể tải người dùng</td></tr>';
  }
}

function renderRole(role) {
  if (role === 'admin') return '<span style="background:#e74c3c;color:white;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">👑 Admin</span>';
  return '<span style="background:#3498db;color:white;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">👤 User</span>';
}

function setupUserSearch() {
  const searchInput = document.getElementById('user-search');
  const refreshBtn = document.getElementById('refresh-users-btn');
  
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadUsers(searchInput.value), 500);
    });
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadUsers(searchInput?.value || ''));
  }
}

window.loadUsers = loadUsers;
