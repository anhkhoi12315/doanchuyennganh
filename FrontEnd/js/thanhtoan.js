// ===== CHECKOUT PAGE - LOAD FROM API =====
let cartData = null;
let appliedCoupon = null;
let discountAmount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  // Check login
  const token = window.api?.getToken && window.api.getToken();
  if (!token) {
    alert('Vui lòng đăng nhập để tiếp tục thanh toán');
    window.location.href = './dangnhap.html';
    return;
  }

  await loadCartAndRender();
  await loadAndFillProfile();
  setupCheckoutForm();
});

async function loadCartAndRender() {
  try {
    const responseData = await window.api.authFetch('/cart');
    cartData = responseData.data || responseData;

    if (!cartData.items || cartData.items.length === 0) {
      alert('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
      window.location.href = './giohang.html';
      return;
    }

    renderOrderSummary();
  } catch (err) {
    console.error('Error loading cart:', err);
    alert('Lỗi tải giỏ hàng');
    window.location.href = './giohang.html';
  }
}

function renderOrderSummary() {
  const container = document.querySelector('.order-summary');
  if (!container) return;

  const items = cartData.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee - discountAmount;

  const itemsHTML = items.map(item => {
    const p = item.product;
    if (!p) return '';
    return `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
        <div style="display:flex;gap:10px;flex:1;">
          <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" 
               style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />
          <div>
            <div style="font-weight:bold;margin-bottom:5px;">${p.name || ''}</div>
            <div style="color:#666;font-size:14px;">SL: ${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight:bold;color:#f86624;">${formatPrice(item.price * item.quantity)}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h2>Đơn hàng của bạn</h2>
    <div style="margin-top:20px;">
      ${itemsHTML}
      <div style="padding:15px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;">
        <span>Tạm tính:</span>
        <span style="font-weight:bold;">${formatPrice(subtotal)}</span>
      </div>
      <div style="padding:15px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;">
        <span>Phí vận chuyển:</span>
        <span style="font-weight:bold;color:#f86624;">${shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
      </div>
      ${shippingFee === 0 ? '<div style="padding:10px;background:#e8f5e9;color:#2e7d32;border-radius:4px;margin:10px 0;font-size:14px;">🎉 Miễn phí vận chuyển cho đơn hàng từ 500.000đ</div>' : ''}
      ${discountAmount > 0 ? `
      <div class="discount-row">
        <span class="discount-label">🎟️ Giảm giá (${appliedCoupon.code}):</span>
        <span class="discount-amount">-${formatPrice(discountAmount)}</span>
      </div>
      ` : ''}
      <div style="padding:20px 0;display:flex;justify-content:space-between;font-size:20px;">
        <span style="font-weight:bold;">Tổng cộng:</span>
        <span style="font-weight:bold;color:#f86624;font-size:24px;">${formatPrice(total)}</span>
      </div>
    </div>
    
    <!-- Mã giảm giá -->
    <div class="coupon-section">
      <div class="coupon-title">Mã giảm giá</div>
      <div class="coupon-input-wrapper">
        <input type="text" id="couponCode" class="coupon-input" placeholder="NHẬP MÃ GIẢM GIÁ" 
          value="${appliedCoupon ? appliedCoupon.code : ''}">
        <button type="button" onclick="${appliedCoupon ? 'removeCoupon()' : 'applyCoupon()'}" 
          class="coupon-btn ${appliedCoupon ? 'coupon-btn-remove' : 'coupon-btn-apply'}">
          ${appliedCoupon ? 'XÓA' : 'ÁP DỤNG'}
        </button>
      </div>
      <div id="couponMessage" class="coupon-message"></div>
    </div>
  `;
}

async function loadAndFillProfile() {
  try {
    const data = await window.api.authFetch('/profile/get-profile');
    
    if (data.profile) {
      const profile = data.profile;
      
      // Pre-fill form with user profile data
      if (profile.fullname) {
        document.getElementById('fullName').value = profile.fullname;
      }
      if (profile.phone) {
        document.getElementById('phone').value = profile.phone;
      }
      if (profile.city) {
        document.getElementById('city').value = profile.city;
      }
      if (profile.district) {
        document.getElementById('district').value = profile.district;
      }
      if (profile.ward) {
        document.getElementById('ward').value = profile.ward;
      }
      if (profile.address) {
        document.getElementById('address').value = profile.address;
      }
      
      console.log('[Checkout] Profile loaded:', profile);
    }
  } catch (err) {
    console.error('Error loading profile for checkout:', err);
    // Not critical - user can still fill manually
  }
}

function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // Setup payment method listeners
  setupPaymentMethodListeners();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const district = document.getElementById('district').value.trim();
    const ward = document.getElementById('ward').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="opt"]:checked').value;

    if (!fullName || !phone || !address || !city) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }

    // Validate phone
    if (!/^[0-9]{10,11}$/.test(phone)) {
      alert('Số điện thoại không hợp lệ');
      return;
    }

    try {
      const orderData = {
        items: cartData.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          district,
          ward
        },
        paymentMethod,
        notes,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      const result = await window.api.authFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!result.success) {
        throw new Error(result.message || 'Đặt hàng thất bại');
      }

      const order = result.data;
      
      // Save order info to localStorage
      localStorage.setItem('lastOrder', JSON.stringify({
        orderNumber: order.orderNumber,
        _id: order._id,
        total: order.total,
        paymentMethod: order.paymentMethod
      }));
      
      // Update header counts
      if (window.initHeader) window.initHeader();
      
      // Handle payment based on method
      if (paymentMethod === 'momo') {
        // For manual MoMo transfer, show QR code
        window.location.href = './xacnhandonhang.html?orderNumber=' + order.orderNumber + '&orderId=' + order._id + '&showMoMoInfo=true';
      } else if (paymentMethod === 'card') {
        // Redirect to VNPay payment (card payment)
        await processVNPayPayment(order);
      } else if (paymentMethod === 'banking') {
        // Show bank transfer info and redirect to confirmation
        window.location.href = './xacnhandonhang.html?orderNumber=' + order.orderNumber + '&orderId=' + order._id + '&showBankInfo=true';
      } else {
        // COD - Direct to confirmation
        window.location.href = './xacnhandonhang.html?orderNumber=' + order.orderNumber + '&orderId=' + order._id;
      }

    } catch (err) {
      console.error('Checkout error:', err);
      alert('❌ Lỗi đặt hàng: ' + err.message);
    }
  });
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

function setupPaymentMethodListeners() {
  const paymentRadios = document.querySelectorAll('input[name="opt"]');
  const detailsDiv = document.getElementById('payment-details');
  
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      showPaymentDetails(radio.value, detailsDiv);
    });
  });
}

function showPaymentDetails(method, container) {
  if (!container) return;
  
  const details = {
    COD: {
      show: true,
      html: `
        <h4 style="margin:0 0 15px 0;color:#f86624;font-size:18px;">📦 Thanh toán khi nhận hàng (COD)</h4>
        <p style="margin:0;color:#666;line-height:1.6;">
          ✅ Bạn sẽ thanh toán bằng tiền mặt khi nhận được hàng<br>
          ✅ Vui lòng kiểm tra kỹ sản phẩm trước khi thanh toán<br>
          ✅ Shipper sẽ liên hệ trước khi giao hàng
        </p>
      `
    },
    momo: {
      show: true,
      html: `
        <h4 style="margin:0 0 15px 0;color:#f86624;font-size:18px;">📱 Thanh toán qua MoMo</h4>
        <div style="background:linear-gradient(135deg, #A50064 0%, #D5006D 100%);color:white;padding:30px;border-radius:12px;text-align:center;">
          <div style="font-size:64px;margin-bottom:15px;">📱</div>
          <h3 style="margin:0 0 10px 0;font-size:24px;">Chuyển tiền qua MoMo</h3>
          <p style="margin:0;opacity:0.95;font-size:16px;line-height:1.6;">
            Thông tin chuyển tiền và mã QR<br>sẽ hiển thị sau khi đặt hàng thành công
          </p>
        </div>
      `
    },
    banking: {
      show: true,
      html: `
        <h4 style="margin:0 0 15px 0;color:#f86624;font-size:18px;">🏧 Chuyển khoản ngân hàng</h4>
        <div style="background:linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);color:white;padding:30px;border-radius:12px;text-align:center;">
          <div style="font-size:64px;margin-bottom:15px;">🏦</div>
          <h3 style="margin:0 0 10px 0;font-size:24px;">Chuyển khoản ngân hàng</h3>
          <p style="margin:0;opacity:0.95;font-size:16px;line-height:1.6;">
            Thông tin tài khoản và mã VietQR<br>sẽ hiển thị sau khi đặt hàng thành công
          </p>
        </div>
      `
    },
    card: {
      show: true,
      html: `
        <h4 style="margin:0 0 15px 0;color:#f86624;font-size:18px;">💳 Thanh toán bằng thẻ</h4>
        <p style="margin:0 0 15px 0;color:#666;">Vui lòng nhập thông tin thẻ của bạn:</p>
        <div style="background:white;padding:20px;border-radius:8px;">
          <div style="margin-bottom:15px;">
            <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Số thẻ:</label>
            <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" 
              style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px;"
              oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim()" />
          </div>
          <div style="display:flex;gap:15px;margin-bottom:15px;">
            <div style="flex:1;">
              <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Ngày hết hạn:</label>
              <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5"
                style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px;"
                oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{2})/g, '$1/').replace(/\\/$/, '')" />
            </div>
            <div style="flex:1;">
              <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">CVV:</label>
              <input type="text" id="card-cvv" placeholder="123" maxlength="3"
                style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px;"
                oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
            </div>
          </div>
          <div style="margin-bottom:15px;">
            <label style="display:block;margin-bottom:5px;font-weight:600;color:#333;">Tên chủ thẻ:</label>
            <input type="text" id="card-name" placeholder="NGUYEN VAN A" 
              style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px;text-transform:uppercase;" />
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:10px;background:#e8f5e9;border-radius:6px;">
            <span style="font-size:24px;">🔒</span>
            <p style="margin:0;font-size:13px;color:#2e7d32;">Giao dịch được mã hóa và bảo mật bởi SSL</p>
          </div>
        </div>
        <p style="margin:15px 0 0 0;color:#999;font-size:13px;">
          💡 Chúng tôi chấp nhận các loại thẻ: Visa, MasterCard, JCB
        </p>
      `
    }
  };
  
  const detail = details[method];
  if (detail && detail.show) {
    container.style.display = 'block';
    container.innerHTML = detail.html;
  } else {
    container.style.display = 'none';
  }
}

// ===== COUPON FUNCTIONS =====
async function applyCoupon() {
  const code = document.getElementById('couponCode').value.trim();
  const messageDiv = document.getElementById('couponMessage');
  
  if (!code) {
    messageDiv.innerHTML = '<span style="color:#dc3545;">⚠️ Vui lòng nhập mã giảm giá</span>';
    return;
  }
  
  try {
    const items = cartData.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const data = await window.api.authFetch('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ 
        code: code,
        orderTotal: subtotal
      })
    });
    
    if (data.success) {
      appliedCoupon = data.coupon;
      discountAmount = data.discountAmount;
      messageDiv.innerHTML = `<span style="color:#28a745;">✅ ${data.message} - Giảm ${formatPrice(discountAmount)}</span>`;
      renderOrderSummary();
    } else {
      messageDiv.innerHTML = `<span style="color:#dc3545;">⚠️ ${data.message}</span>`;
    }
  } catch (error) {
    console.error('Error applying coupon:', error);
    messageDiv.innerHTML = `<span style="color:#dc3545;">⚠️ ${error.message}</span>`;
  }
}

function removeCoupon() {
  appliedCoupon = null;
  discountAmount = 0;
  document.getElementById('couponMessage').innerHTML = '';
  renderOrderSummary();
}

// ===== PAYMENT GATEWAY FUNCTIONS =====

// Process MoMo payment
async function processMoMoPayment(order) {
  try {
    const result = await window.api.authFetch('/payment/momo/create', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order._id,
        amount: order.total,
        orderInfo: `Thanh toán đơn hàng ${order.orderNumber}`
      })
    });

    if (result.success && result.data.payUrl) {
      // Redirect to MoMo payment page
      window.location.href = result.data.payUrl;
    } else {
      throw new Error(result.message || 'Không thể tạo thanh toán MoMo');
    }
  } catch (error) {
    console.error('MoMo payment error:', error);
    alert('❌ Lỗi thanh toán MoMo: ' + error.message);
    // Fallback to confirmation page
    window.location.href = './xacnhandonhang.html?orderNumber=' + order.orderNumber + '&orderId=' + order._id;
  }
}

// Process VNPay payment (for card payment)
async function processVNPayPayment(order) {
  try {
    const result = await window.api.authFetch('/payment/vnpay/create', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order._id,
        amount: order.total,
        orderInfo: `Thanh toán đơn hàng ${order.orderNumber}`,
        bankCode: '' // Empty for showing all banks
      })
    });

    if (result.success && result.data.payUrl) {
      // Redirect to VNPay payment page
      window.location.href = result.data.payUrl;
    } else {
      throw new Error(result.message || 'Không thể tạo thanh toán VNPay');
    }
  } catch (error) {
    console.error('VNPay payment error:', error);
    alert('❌ Lỗi thanh toán VNPay: ' + error.message);
    // Fallback to confirmation page
    window.location.href = './xacnhandonhang.html?orderNumber=' + order.orderNumber + '&orderId=' + order._id;
  }
}
