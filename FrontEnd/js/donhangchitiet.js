// ===== ORDER DETAIL PAGE =====
let currentOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check login
  const token = window.api?.getToken && window.api.getToken();
  if (!token) {
    alert('Vui lòng đăng nhập');
    window.location.href = './dangnhap.html';
    return;
  }

  // Get order ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    alert('Không tìm thấy đơn hàng');
    window.location.href = './donhang.html';
    return;
  }

  await loadOrderDetail(orderId);
});

async function loadOrderDetail(orderId) {
  try {
    const data = await window.api.authFetch(`/orders/${orderId}`);

    if (!data.success) {
      throw new Error(data.message || 'Lỗi tải đơn hàng');
    }

    currentOrder = data.data;
    renderOrderDetail(currentOrder);

  } catch (err) {
    console.error('Error loading order detail:', err);
    document.getElementById('order-detail-content').innerHTML = `
      <div style="text-align:center;padding:60px;color:#f00;">
        <p style="font-size:18px;">❌ Lỗi: ${err.message}</p>
        <a href="./donhang.html" style="color:#f86624;margin-top:20px;display:inline-block;">Quay lại</a>
      </div>
    `;
  }
}

function renderOrderDetail(order) {
  const container = document.getElementById('order-detail-content');
  const canCancel = ['pending', 'confirmed'].includes(order.orderStatus);

  container.innerHTML = `
    <!-- Header -->
    <div class="detail-header">
      <h1 class="order-title">Đơn hàng #${order.orderNumber || order._id}</h1>
      <div class="order-meta">
        <span>📅 ${formatDate(order.createdAt)}</span>
        <span>📦 ${getStatusText(order.orderStatus)}</span>
        <span>💳 ${getPaymentMethodText(order.paymentMethod)}</span>
      </div>
    </div>

    <!-- Products -->
    <div class="section">
      <h2 class="section-title">Sản phẩm</h2>
      <div class="product-list">
        ${order.items.map(item => `
          <div class="product-item">
            <img src="${item.image || './img/placeholder.png'}" alt="${item.name}" class="product-image" />
            <div class="product-info">
              <div class="product-name">${item.name}</div>
              <div style="color:#666;margin:5px 0;">Số lượng: ${item.quantity}</div>
              <div class="product-price">${formatPrice(item.price)} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Shipping Address -->
    <div class="section">
      <h2 class="section-title">Thông tin giao hàng</h2>
      <div class="info-row">
        <span class="info-label">Người nhận:</span>
        <span class="info-value">${order.shippingAddress.fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Số điện thoại:</span>
        <span class="info-value">${order.shippingAddress.phone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Địa chỉ:</span>
        <span class="info-value">
          ${order.shippingAddress.address}${order.shippingAddress.ward ? ', ' + order.shippingAddress.ward : ''}${order.shippingAddress.district ? ', ' + order.shippingAddress.district : ''}${order.shippingAddress.city ? ', ' + order.shippingAddress.city : ''}
        </span>
      </div>
      ${order.notes ? `
      <div class="info-row">
        <span class="info-label">Ghi chú:</span>
        <span class="info-value">${order.notes}</span>
      </div>
      ` : ''}
    </div>

    <!-- Payment Info -->
    <div class="section">
      <h2 class="section-title">Thanh toán</h2>
      <div class="info-row">
        <span class="info-label">Tạm tính:</span>
        <span class="info-value">${formatPrice(order.subtotal)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phí vận chuyển:</span>
        <span class="info-value">${order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
      </div>
      <div class="total-row">
        <span>Tổng cộng:</span>
        <span>${formatPrice(order.total)}</span>
      </div>
    </div>

    <!-- Status History -->
    ${order.statusHistory && order.statusHistory.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Lịch sử đơn hàng</h2>
      <div class="status-timeline">
        ${order.statusHistory.map(history => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-status">${getStatusText(history.status)}</div>
              ${history.note ? `<div style="color:#666;margin:5px 0;">${history.note}</div>` : ''}
              <div class="timeline-date">${formatDate(history.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Actions -->
    ${canCancel ? `
    <div class="action-buttons">
      <button class="btn btn-cancel" onclick="cancelOrder()">Hủy đơn hàng</button>
      <button class="btn btn-secondary" onclick="window.location.href='./donhang.html'">Quay lại</button>
    </div>
    ` : ''}
  `;
}

async function cancelOrder() {
  if (!currentOrder) return;
  if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

  try {
    const result = await window.api.authFetch(`/orders/${currentOrder._id}/cancel`, {
      method: 'PATCH'
    });

    if (!result.success) {
      throw new Error(result.message || 'Hủy đơn thất bại');
    }

    alert('✅ Đã hủy đơn hàng thành công');
    window.location.href = './donhang.html';

  } catch (err) {
    console.error('Cancel order error:', err);
    alert('❌ Lỗi hủy đơn: ' + err.message);
  }
}

function getStatusText(status) {
  const statusMap = {
    pending: '⏳ Chờ xác nhận',
    confirmed: '✅ Đã xác nhận',
    shipping: '🚚 Đang giao hàng',
    delivered: '📦 Đã giao hàng',
    cancelled: '❌ Đã hủy'
  };
  return statusMap[status] || status;
}

function getPaymentMethodText(method) {
  const methods = {
    'COD': 'Thanh toán khi nhận hàng',
    'momo': 'Ví MoMo',
    'banking': 'Chuyển khoản',
    'card': 'Thẻ tín dụng',
    'zalopay': 'ZaloPay'
  };
  return methods[method] || method;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

window.cancelOrder = cancelOrder;
