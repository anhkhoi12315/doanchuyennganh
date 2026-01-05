// ===== MY ORDERS PAGE =====
let allOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // Check login
  const token = window.api?.getToken && window.api.getToken();
  if (!token) {
    alert('Vui lòng đăng nhập để xem đơn hàng');
    window.location.href = './dangnhap.html';
    return;
  }

  await loadOrders();
  setupFilterTabs();
});

async function loadOrders() {
  const container = document.querySelector('.orders-container, .order-list, #orders-list');
  if (!container) {
    console.error('Orders container not found');
    return;
  }
  
  try {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ Đang tải...</div>';
    
    const data = await window.api.authFetch('/orders/my-orders?limit=50');
    
    if (!data.success) {
      throw new Error(data.message || 'Lỗi tải đơn hàng');
    }

    allOrders = data.data || [];
    renderOrders(allOrders);

  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#f00;">❌ Lỗi tải đơn hàng: ${err.message}</div>
    `;
  }
}

function setupFilterTabs() {
  updateFilterCounts();
  
  const tabs = document.querySelectorAll('.filter-tab, [data-status]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter orders
      currentFilter = tab.dataset.status;
      const filtered = currentFilter === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.orderStatus === currentFilter);
      
      renderOrders(filtered);
    });
  });
}

function updateFilterCounts() {
  const statusCounts = {
    all: allOrders.length,
    pending: allOrders.filter(o => o.orderStatus === 'pending').length,
    confirmed: allOrders.filter(o => o.orderStatus === 'confirmed').length,
    shipping: allOrders.filter(o => o.orderStatus === 'shipping').length,
    delivered: allOrders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: allOrders.filter(o => o.orderStatus === 'cancelled').length
  };
  
  const tabs = document.querySelectorAll('.filter-tab, [data-status]');
  tabs.forEach(tab => {
    const status = tab.dataset.status;
    const count = statusCounts[status] || 0;
    
    // Remove old count badge if exists
    const oldBadge = tab.querySelector('.filter-count');
    if (oldBadge) oldBadge.remove();
    
    // Add new count badge
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'filter-count';
      badge.textContent = count;
      tab.appendChild(badge);
    }
  });
}

function renderOrders(orders) {
  const container = document.querySelector('.orders-container, .order-list, #orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px;">
        <p style="font-size:60px;margin-bottom:20px;">📦</p>
        <h3 style="color:#999;margin-bottom:20px;">Chưa có đơn hàng nào</h3>
        <a href="./danhmuc.html" style="display:inline-block;padding:12px 24px;background:#f86624;color:white;text-decoration:none;border-radius:6px;">Mua sắm ngay</a>
      </div>
    `;
    return;
  }

  const html = orders.map(order => renderOrderCard(order)).join('');
  container.innerHTML = html;
  
  // Attach cancel handlers
  attachCancelHandlers();
}

// Render single order card
function renderOrderCard(order) {
  const statusMap = {
    pending: { text: 'Chờ xác nhận', color: '#f39c12', icon: '⏰' },
    confirmed: { text: 'Đã xác nhận', color: '#3498db', icon: '✓' },
    processing: { text: 'Đang chuẩn bị', color: '#9b59b6', icon: '📦' },
    shipping: { text: 'Đang giao hàng', color: '#16a085', icon: '🚚' },
    delivered: { text: 'Đã giao hàng', color: '#27ae60', icon: '✅' },
    cancelled: { text: 'Đã hủy', color: '#e74c3c', icon: '❌' }
  };
  
  const status = statusMap[order.orderStatus] || statusMap.pending;
  const canCancel = ['pending', 'confirmed'].includes(order.orderStatus);
  
  // Show first 2 items
  const displayItems = order.items.slice(0, 2);
  const moreCount = order.items.length - 2;
  
  return `
    <div class="order-card" style="background:white;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:all 0.3s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:2px solid #f5f5f5;margin-bottom:15px;">
        <div>
          <div style="font-size:20px;font-weight:700;color:#f86624;">Đơn hàng #${order.orderNumber || order._id.slice(-8)}</div>
          <div style="color:#999;font-size:14px;margin-top:5px;">📅 ${formatDate(order.createdAt)}</div>
        </div>
        <span style="background:${status.color};color:white;padding:8px 16px;border-radius:25px;font-size:14px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          ${status.icon} ${status.text}
        </span>
      </div>
      
      <!-- Items -->
      <div style="padding:15px 0;">
        ${displayItems.map(item => `
          <div style="display:flex;gap:15px;padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:10px;">
            <img src="${item.image || './img/placeholder.png'}" alt="${item.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e0e0e0;" />
            <div style="flex:1;">
              <div style="font-weight:600;font-size:16px;margin-bottom:5px;color:#333;">${item.name}</div>
              <div style="color:#666;font-size:14px;margin:5px 0;">SL: ${item.quantity} × ${formatPrice(item.price)}</div>
              <div style="color:#f86624;font-weight:700;font-size:16px;margin-top:5px;">${formatPrice(item.price * item.quantity)}</div>
            </div>
          </div>
        `).join('')}
        ${moreCount > 0 ? `<div style="text-align:center;color:#666;font-size:14px;padding:10px;">+${moreCount} sản phẩm khác</div>` : ''}
      </div>
      
      <!-- Footer -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:15px;border-top:2px solid #f5f5f5;">
        <div>
          <div style="color:#666;font-size:14px;margin-bottom:5px;">Tổng thanh toán:</div>
          <div style="font-size:24px;font-weight:700;color:#f86624;">${formatPrice(order.total)}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <a href="./donhangchitiet.html?id=${order._id}" style="background:#3498db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;transition:all 0.3s;display:inline-block;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">📋 Chi tiết</a>
          ${canCancel ? `<button class="btn-cancel-order" data-id="${order._id}" style="background:#e74c3c;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s;" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">❌ Hủy đơn</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Setup filters
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn, [data-status]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const status = btn.getAttribute('data-status') || '';
      loadMyOrders(status);
    });
  });
}

// Attach cancel order handlers
function attachCancelHandlers() {
  document.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
      
      const orderId = btn.getAttribute('data-id');
      
      try {
        btn.disabled = true;
        btn.textContent = '⏳ Đang hủy...';
        
        const result = await window.api.authFetch('/orders/' + orderId + '/cancel', {
          method: 'PATCH'
        });
        
        if (!result.success) {
          throw new Error(result.message || 'Hủy đơn thất bại');
        }
        
        alert('✅ Đã hủy đơn hàng thành công!');
        await loadOrders(); // Reload orders
        
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('❌ Không thể hủy đơn hàng: ' + err.message);
        btn.disabled = false;
        btn.textContent = '❌ Hủy đơn';
      }
    });
  });
}

// Make cancel function global for inline onclick
window.cancelOrder = async function(orderId) {
  if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
  
  try {
    const result = await window.api.authFetch('/orders/' + orderId + '/cancel', {
      method: 'PATCH'
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Hủy đơn thất bại');
    }
    
    alert('✅ Đã hủy đơn hàng thành công!');
    await loadOrders();
    
  } catch (err) {
    console.error('Error cancelling order:', err);
    alert('❌ Lỗi hủy đơn: ' + err.message);
  }
};

// Render pagination
function renderPagination(pagination, status) {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) return;
  
  const { page, pages } = pagination;
  let html = '';
  
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="loadMyOrders('${status}', ${i})">${i}</button>`;
  }
  
  paginationContainer.innerHTML = html;
}

// Format price
function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

// Format date
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Make loadMyOrders global for pagination
window.loadMyOrders = loadMyOrders;
