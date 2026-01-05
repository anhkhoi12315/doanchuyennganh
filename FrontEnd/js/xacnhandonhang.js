// ===== ORDER SUCCESS PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  displayOrderInfo();
  setupViewOrdersButton();
});

async function displayOrderInfo() {
  // Get order info from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('orderNumber');
  const orderId = urlParams.get('orderId');
  const showBankInfo = urlParams.get('showBankInfo') === 'true';
  const showMoMoInfo = urlParams.get('showMoMoInfo') === 'true';
  
  if (!orderNumber && !orderId) {
    // Try localStorage
    const orderData = localStorage.getItem('lastOrder');
    if (orderData) {
      const order = JSON.parse(orderData);
      await renderOrderDetails(order, showBankInfo, showMoMoInfo);
      localStorage.removeItem('lastOrder');
    } else {
      document.getElementById('order-details').innerHTML = `
        <div style="text-align:center;padding:20px;color:#999;">
          <p>Không tìm thấy thông tin đơn hàng</p>
          <a href="./index.html" style="color:#f86624;">Quay về trang chủ</a>
        </div>
      `;
    }
    return;
  }

  // If we have order info from URL
  if (orderNumber) {
    await renderOrderDetails({ orderNumber, orderId, _id: orderId }, showBankInfo, showMoMoInfo);
  }
}

async function renderOrderDetails(order, showBankInfo = false, showMoMoInfo = false) {
  const container = document.getElementById('order-details');
  
  const orderNumber = order.orderNumber || order._id || 'N/A';
  const paymentMethod = getPaymentMethodText(order.paymentMethod || 'COD');
  const total = order.total || 0;
  const orderId = order._id || order.orderId || '';
  
  // Fetch bank info if showBankInfo
  let bankInfoHtml = '';
  if (showBankInfo && orderId) {
    try {
      const result = await window.api.authFetch(`/payment/${orderId}/bank-info`);
      if (result.success && result.data.bankInfo) {
        const bank = result.data.bankInfo;
        bankInfoHtml = `
          <div style="margin-top:25px;padding:25px;background:#e3f2fd;border-radius:12px;border-left:4px solid #2196F3;">
            <h3 style="color:#1976d2;margin-bottom:15px;font-size:20px;">🏦 Thông tin chuyển khoản</h3>
            <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
              <div style="flex:1;min-width:300px;background:white;padding:20px;border-radius:8px;">
                <div style="margin-bottom:12px;">
                  <p style="color:#666;font-size:13px;margin-bottom:4px;">Ngân hàng:</p>
                  <p style="font-weight:bold;font-size:16px;color:#333;">${bank.bankName} (${bank.bankCode})</p>
                </div>
                <div style="margin-bottom:12px;">
                  <p style="color:#666;font-size:13px;margin-bottom:4px;">Số tài khoản:</p>
                  <p style="font-weight:bold;font-size:18px;color:#f86624;letter-spacing:1px;">${bank.accountNumber}</p>
                </div>
                <div style="margin-bottom:12px;">
                  <p style="color:#666;font-size:13px;margin-bottom:4px;">Chủ tài khoản:</p>
                  <p style="font-weight:bold;font-size:15px;color:#333;">${bank.accountName}</p>
                </div>
                <div style="margin-bottom:12px;">
                  <p style="color:#666;font-size:13px;margin-bottom:4px;">Số tiền:</p>
                  <p style="font-weight:bold;font-size:22px;color:#4CAF50;">${formatPrice(result.data.amount)}</p>
                </div>
                <hr style="border:none;border-top:1px dashed #ddd;margin:15px 0;">
                <div>
                  <p style="color:#666;font-size:13px;margin-bottom:4px;">Nội dung chuyển khoản:</p>
                  <p style="font-weight:bold;font-size:16px;color:#1976d2;background:#e3f2fd;padding:10px;border-radius:6px;">${bank.content}</p>
                </div>
              </div>
              ${bank.qrCodeUrl ? `
              <div style="text-align:center;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <img src="${bank.qrCodeUrl}" alt="VietQR Code" style="width:250px;height:250px;border-radius:8px;border:2px solid #e0e0e0;" />
                <p style="margin:15px 0 0 0;font-size:14px;color:#666;font-weight:bold;">📱 Quét mã để chuyển khoản</p>
                <p style="margin:5px 0 0 0;font-size:12px;color:#999;">Thông tin tự động điền sẵn</p>
              </div>
              ` : ''}
            </div>
            <div style="color:#1976d2;font-size:14px;line-height:1.6;margin-top:20px;background:white;padding:15px;border-radius:8px;">
              <p><strong>📌 Lưu ý quan trọng:</strong></p>
              <p>• Vui lòng chuyển khoản <strong>ĐÚNG số tiền</strong> và <strong>ghi rõ nội dung</strong></p>
              <p>• Đơn hàng sẽ được xác nhận sau <strong>5-30 phút</strong> kể từ khi chuyển khoản thành công</p>
              <p>• Bạn có thể kiểm tra trạng thái đơn hàng trong mục <a href="./donhang.html" style="color:#f86624;font-weight:bold;">Đơn hàng của tôi</a></p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching bank info:', error);
    }
  }

  // Fetch MoMo info if showMoMoInfo
  let momoInfoHtml = '';
  if (showMoMoInfo && orderId) {
    try {
      const result = await window.api.authFetch(`/payment/${orderId}/momo-info`);
      if (result.success && result.data.momoInfo) {
        const momo = result.data.momoInfo;
        momoInfoHtml = `
          <div style="margin-top:25px;padding:25px;background:#fce4ec;border-radius:12px;border-left:4px solid #A50064;">
            <h3 style="color:#A50064;margin-bottom:15px;font-size:20px;">📱 Thanh toán qua MoMo</h3>
            <div style="background:white;padding:25px;border-radius:8px;">
              <div style="text-align:center;margin-bottom:25px;">
                <div style="font-size:64px;margin-bottom:15px;">📱</div>
                <h4 style="margin:0;color:#A50064;font-size:24px;">Chuyển tiền MoMo</h4>
                <p style="margin:5px 0 0 0;color:#666;">Vui lòng chuyển tiền thủ công qua app MoMo</p>
              </div>
              
              <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:15px;">
                <div style="margin-bottom:15px;">
                  <p style="color:#666;font-size:13px;margin-bottom:6px;">Số điện thoại MoMo:</p>
                  <p style="font-weight:bold;font-size:26px;color:#A50064;letter-spacing:2px;margin:0;">${momo.phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</p>
                </div>
                <hr style="border:none;border-top:2px dashed #ddd;margin:15px 0;">
                <div style="margin-bottom:15px;">
                  <p style="color:#666;font-size:13px;margin-bottom:6px;">Tên tài khoản:</p>
                  <p style="font-weight:bold;font-size:18px;color:#333;margin:0;">${momo.accountName}</p>
                </div>
                <hr style="border:none;border-top:2px dashed #ddd;margin:15px 0;">
                <div style="margin-bottom:15px;">
                  <p style="color:#666;font-size:13px;margin-bottom:6px;">Số tiền:</p>
                  <p style="font-weight:bold;font-size:28px;color:#4CAF50;margin:0;">${formatPrice(result.data.amount)}</p>
                </div>
                <hr style="border:none;border-top:2px dashed #ddd;margin:15px 0;">
                <div>
                  <p style="color:#666;font-size:13px;margin-bottom:6px;">Nội dung chuyển khoản:</p>
                  <p style="font-weight:bold;font-size:16px;color:#333;background:#fff3cd;padding:12px;border-radius:6px;margin:0;">${momo.content}</p>
                </div>
              </div>

              <div style="text-align:center;margin-bottom:20px;">
                <div style="display:inline-block;background:white;padding:30px;border-radius:12px;border:3px solid #A50064;box-shadow:0 4px 20px rgba(165,0,100,0.2);">
                  <img src="./img/qr-momo-khoi.png" alt="QR MoMo" style="width:400px;height:auto;border-radius:8px;" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=0369604155&color=A50064'">
                  <p style="margin:20px 0 0 0;font-weight:bold;color:#A50064;font-size:18px;">📱 Quét mã để thanh toán</p>
                </div>
              </div>

              <div style="background:#fff8e1;padding:15px;border-radius:8px;border-left:4px solid #ffc107;">
                <p style="margin:0 0 8px 0;color:#f57c00;font-weight:bold;font-size:15px;">⚠️ Lưu ý quan trọng:</p>
                <ul style="margin:0;padding-left:20px;color:#856404;line-height:1.7;">
                  <li>MoMo <strong>KHÔNG hỗ trợ QR tĩnh</strong> - vui lòng chuyển tiền thủ công</li>
                  <li>Nhập đúng <strong>nội dung chuyển khoản</strong> để xác nhận đơn hàng</li>
                  <li>Sau khi chuyển, <strong>chụp màn hình biên lai</strong> gửi cho shop</li>
                  <li>Đơn hàng sẽ được xác nhận sau <strong>5-30 phút</strong></li>
                </ul>
              </div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching MoMo info:', error);
    }
  }
  
  container.innerHTML = `
    <div class="order-row">
      <span class="order-label">Mã đơn hàng:</span>
      <span class="order-number">${orderNumber}</span>
    </div>
    <div class="order-row">
      <span class="order-label">Phương thức thanh toán:</span>
      <span class="order-value">${paymentMethod}</span>
    </div>
    ${total > 0 ? `
    <div class="order-row">
      <span class="order-label">Tổng tiền:</span>
      <span class="order-value" style="font-size:20px;font-weight:bold;color:#f86624;">${formatPrice(total)}</span>
    </div>
    ` : ''}
    <div class="order-row">
      <span class="order-label">Trạng thái:</span>
      <span class="order-value" style="color:#4CAF50;font-weight:bold;">Đang xử lý</span>
    </div>
    
    ${bankInfoHtml || momoInfoHtml || `
    <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;color:#856404;">
      <strong>📦 Lưu ý:</strong> Đơn hàng của bạn đang được xử lý. 
      Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.
    </div>
    `}
  `;
}

function getPaymentMethodText(method) {
  const methods = {
    'COD': '💵 Thanh toán khi nhận hàng (COD)',
    'momo': '🏦 Ví điện tử MoMo',
    'banking': '🏧 Chuyển khoản ngân hàng',
    'card': '💳 Thanh toán thẻ',
    'zalopay': '💰 ZaloPay'
  };
  return methods[method] || method;
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

function setupViewOrdersButton() {
  const btn = document.getElementById('view-orders-btn');
  if (btn) {
    btn.href = './donhang.html';
  }
}
