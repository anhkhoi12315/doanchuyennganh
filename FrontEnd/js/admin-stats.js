// ===== ADMIN STATISTICS =====
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('tab-stats')) {
    await loadStats();
  }
});

async function loadStats() {
  const container = document.getElementById('stats-container');
  if (!container) return;
  
  try {
    container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Đang tải thống kê...</div>';
    
    const response = await window.api.authFetch('/admin/orders/stats');
    console.log('[Admin Stats] Response:', response);
    
    // Handle different response structures
    let stats = {};
    if (response.data) {
      stats = response.data;
    } else if (response.success && response.data) {
      stats = response.data;
    } else {
      stats = response;
    }
    
    // Create stats cards
    const summary = stats.summary || {};
    const ordersByStatus = stats.ordersByStatus || [];
    console.log('[Admin Stats] Summary:', summary);
    console.log('[Admin Stats] Orders by status:', ordersByStatus);
    
    const statsCards = [
      {
        title: '💰 Tổng doanh thu',
        value: (stats.totalRevenue || 0).toLocaleString('vi-VN') + ' VNĐ',
        subtitle: `${summary.totalOrders || 0} đơn hàng`,
        color: '#27ae60'
      },
      {
        title: '📦 Tổng đơn hàng',
        value: summary.totalOrders || 0,
        subtitle: 'Tất cả đơn',
        color: '#3498db'
      },
      {
        title: '⏰ Chờ xác nhận',
        value: summary.pendingOrders || 0,
        subtitle: 'Đơn hàng',
        color: '#f39c12'
      },
      {
        title: '✔️ Đã xác nhận',
        value: summary.confirmedOrders || 0,
        subtitle: 'Đơn hàng',
        color: '#16a085'
      },
      {
        title: '🚚 Đang giao',
        value: summary.shippingOrders || 0,
        subtitle: 'Đơn hàng',
        color: '#16a085'
      },
      {
        title: '✅ Đã giao',
        value: summary.deliveredOrders || 0,
        subtitle: 'Đơn hàng',
        color: '#27ae60'
      },
      {
        title: '❌ Đã hủy',
        value: summary.cancelledOrders || 0,
        subtitle: 'Đơn hàng',
        color: '#e74c3c'
      }
    ];
    
    container.innerHTML = statsCards.map(card => `
      <div style="background:white;padding:25px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border-left:4px solid ${card.color};">
        <div style="font-size:14px;color:#999;margin-bottom:10px;">${card.title}</div>
        <div style="font-size:28px;font-weight:700;color:${card.color};margin-bottom:5px;">${card.value}</div>
        <div style="font-size:12px;color:#999;">${card.subtitle}</div>
      </div>
    `).join('');
    
    // Load product stats
    await loadProductStats();
    await loadUserStats();
    
  } catch (err) {
    console.error('Error loading stats:', err);
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ Không thể tải thống kê</div>';
  }
}

async function loadProductStats() {
  try {
    const response = await fetch(window.api.BASE_URL + '/products?limit=1000&sort=-sold');
    const data = await response.json();
    const products = data.products || [];
    
    const revenueChart = document.getElementById('revenue-chart');
    if (revenueChart) {
      const topProducts = products.slice(0, 5);
      revenueChart.innerHTML = `
        <h4 style="margin-bottom:15px;">🏆 Top 5 Sản phẩm bán chạy</h4>
        ${topProducts.map((p, idx) => `
          <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;align-items:center;">
            <div style="display:flex;gap:10px;align-items:center;">
              <span style="background:#f86624;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;">${idx + 1}</span>
              <div>
                <div style="font-weight:600;">${p.name}</div>
                <div style="color:#999;font-size:12px;">Đã bán: ${p.sold || 0} | Tồn kho: ${p.stock || 0}</div>
              </div>
            </div>
            <div style="font-weight:700;color:#27ae60;">${((p.salePrice || p.price) * (p.sold || 0)).toLocaleString('vi-VN')} VNĐ</div>
          </div>
        `).join('')}
      `;
    }
  } catch (err) {
    console.error('Error loading product stats:', err);
  }
}

async function loadUserStats() {
  try {
    const response = await window.api.authFetch('/admin/users/stats');
    const stats = response.data || {};
    
    // Add user stats card if not exists
    const container = document.getElementById('stats-container');
    if (container && stats.totalUsers) {
      container.innerHTML += `
        <div style="background:white;padding:25px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border-left:4px solid #9b59b6;">
          <div style="font-size:14px;color:#999;margin-bottom:10px;">👥 Tổng người dùng</div>
          <div style="font-size:28px;font-weight:700;color:#9b59b6;margin-bottom:5px;">${stats.totalUsers}</div>
          <div style="font-size:12px;color:#999;">Admin: ${stats.totalAdmins || 0} | User: ${stats.totalCustomers || 0}</div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading user stats:', err);
  }
}

window.loadStats = loadStats;
