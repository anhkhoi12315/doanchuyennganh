// ===== ADMIN ORDERS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('tab-orders')) {
    await loadOrders();
    setupOrderFilters();
  }
});

async function loadOrders(status = '', page = 1) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  
  try {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">⏳ Đang tải...</td></tr>';
    
    let url = `/admin/orders?page=${page}&limit=20`;
    if (status && status !== 'all') url += `&status=${status}`;
    
    console.log('[Admin Orders] Fetching:', url);
    const response = await window.api.authFetch(url);
    console.log('[Admin Orders] Response:', response);
    
    // Handle different response structures
    let orders = [];
    if (Array.isArray(response)) {
      orders = response;
    } else if (response.data && Array.isArray(response.data.orders)) {
      orders = response.data.orders;
    } else if (response.data && Array.isArray(response.data)) {
      orders = response.data;
    } else if (response.success && Array.isArray(response.data?.orders)) {
      orders = response.data.orders;
    }
    
    console.log('[Admin Orders] Orders count:', orders.length);
    
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">Chưa có đơn hàng nào</td></tr>';
      return;
    }
    
    tbody.innerHTML = orders.map(order => `
      <tr>
        <td><strong>${order.orderNumber}</strong></td>
        <td>${order.user?.fullname || order.user?.email || 'N/A'}<br><small style="color:#999;">${order.user?.phone || ''}</small></td>
        <td><strong>${(order.total || 0).toLocaleString('vi-VN')} VNĐ</strong></td>
        <td>${renderOrderStatus(order.orderStatus)}</td>
        <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
        <td>
          <select class="order-status-select" data-id="${order._id}" style="padding:5px;border:1px solid #ddd;border-radius:4px;margin-right:5px;">
            <option value="">-- Cập nhật --</option>
            <option value="confirmed">Xác nhận</option>
            <option value="processing">Chuẩn bị</option>
            <option value="shipping">Giao hàng</option>
            <option value="delivered">Đã giao</option>
            <option value="cancelled">Hủy</option>
          </select>
          <button class="delete-order-btn" data-id="${order._id}" data-status="${order.orderStatus}" 
            style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;margin-left:5px;"
            title="Xóa đơn hàng (chỉ đơn đã hủy hoặc đã giao)">
            🗑️ Xóa
          </button>
        </td>
      </tr>
    `).join('');
    
    // Attach change handlers
    tbody.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = select.getAttribute('data-id');
        const newStatus = select.value;
        if (!newStatus) return;
        
        try {
          await window.api.authFetch(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus, note: 'Admin cập nhật' })
          });
          alert('✅ Đã cập nhật trạng thái!');
          loadOrders(document.getElementById('order-status-filter')?.value || '');
        } catch (err) {
          alert('❌ Lỗi: ' + err.message);
        }
      });
    });
    
    // Attach delete handlers
    tbody.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderId = btn.getAttribute('data-id');
        const status = btn.getAttribute('data-status');
        
        // Kiểm tra trạng thái
        if (!['cancelled', 'delivered'].includes(status)) {
          alert('⚠️ Chỉ có thể xóa đơn hàng đã hủy hoặc đã giao!');
          return;
        }
        
        if (!confirm('⚠️ Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác!')) {
          return;
        }
        
        try {
          await window.api.authFetch(`/admin/orders/${orderId}`, {
            method: 'DELETE'
          });
          alert('✅ Đã xóa đơn hàng thành công!');
          loadOrders(document.getElementById('order-status-filter')?.value || '');
        } catch (err) {
          alert('❌ Lỗi: ' + err.message);
        }
      });
    });
    
  } catch (err) {
    console.error('Error loading orders:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#e74c3c;">❌ Không thể tải đơn hàng: ${err.message}</td></tr>`;
  }
}

function renderOrderStatus(status) {
  const statusMap = {
    pending: { text: 'Chờ xác nhận', color: '#f39c12' },
    confirmed: { text: 'Đã xác nhận', color: '#3498db' },
    processing: { text: 'Đang chuẩn bị', color: '#9b59b6' },
    shipping: { text: 'Đang giao', color: '#16a085' },
    delivered: { text: 'Đã giao', color: '#27ae60' },
    cancelled: { text: 'Đã hủy', color: '#e74c3c' }
  };
  const s = statusMap[status] || statusMap.pending;
  return `<span style="background:${s.color};color:white;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">${s.text}</span>`;
}

function setupOrderFilters() {
  const filterSelect = document.getElementById('order-status-filter');
  const refreshBtn = document.getElementById('refresh-orders-btn');
  
  if (filterSelect) {
    filterSelect.addEventListener('change', () => loadOrders(filterSelect.value));
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadOrders(filterSelect?.value || ''));
  }
}

window.loadOrders = loadOrders;
