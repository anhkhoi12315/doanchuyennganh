// Socket.io client để nhận real-time updates
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Đã kết nối Socket.io');
});

socket.on('disconnect', () => {
  console.log('❌ Mất kết nối Socket.io');
});

// Lắng nghe sự kiện sản phẩm mới được tạo
socket.on('productCreated', async (product) => {
  console.log('🆕 Sản phẩm mới:', product);
  
  // Hiển thị thông báo
  showNotification('Sản phẩm mới đã được thêm!', 'success');
  
  // Fetch data mới từ database và cập nhật giao diện
  await refreshProductData();
});

// Lắng nghe sự kiện sản phẩm được cập nhật
socket.on('productUpdated', async (product) => {
  console.log('♻️ Sản phẩm cập nhật:', product);
  
  // Hiển thị thông báo
  showNotification('Sản phẩm đã được cập nhật!', 'info');
  
  // Fetch data mới từ database và cập nhật giao diện
  await refreshProductData();
});

// Lắng nghe sự kiện sản phẩm bị xóa
socket.on('productDeleted', async (data) => {
  console.log('🗑️ Sản phẩm đã xóa:', data.id);
  
  // Hiển thị thông báo
  showNotification('Sản phẩm đã được xóa!', 'warning');
  
  // Fetch data mới từ database và cập nhật giao diện
  await refreshProductData();
});

// Hàm refresh data từ database dựa trên trang hiện tại
async function refreshProductData() {
  const pathname = window.location.pathname;
  
  try {
    if (pathname.includes('index.html') || pathname.endsWith('/')) {
      // Trang chủ - reload các grid sản phẩm
      await refreshHomePage();
    } else if (pathname.includes('danhmuc.html')) {
      // Trang danh mục - reload danh sách sản phẩm
      await refreshCategoryPage();
    } else if (pathname.includes('admin.html')) {
      // Trang admin - reload bảng quản lý
      await refreshAdminPage();
    } else if (pathname.includes('sanpham.html')) {
      // Trang chi tiết sản phẩm - reload thông tin sản phẩm
      await refreshProductDetailPage();
    }
  } catch (error) {
    console.error('Lỗi khi refresh data:', error);
  }
}

// Refresh trang chủ - load lại products từ database
async function refreshHomePage() {
  if (!window.api || !window.api.getProducts) return;
  
  const products = await window.api.getProducts();
  
  // Cập nhật deals section
  const dealsContainer = document.querySelector('#home-deals-grid');
  if (dealsContainer) {
    dealsContainer.innerHTML = '';
    const deals = products.slice(0, 6);
    deals.forEach(p => {
      const html = `
        <section class="prod-list__item">
          <div class="prod-list__item__image">
            <a href="./sanpham.html?id=${p._id}"><img class="prod-list__item__img1" loading="lazy" alt="" src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}"/></a>
            <span class="product-sale-tag"><span> SALES!</span></span>
            <div class="button-heart-cart-hover">
              <button class="btn-heart" data-id="${p._id}" aria-label="Yêu thích"><img src="./icon/heart.svg"/></button>
              <button class="btn-cart add-to-cart-inline" data-id="${p._id}" aria-label="Thêm vào giỏ"><img src="./icon/cart.svg"/></button>
            </div>
          </div>
          <div class="prod-list__item__inner">
            <div class="prod-list__item__inner--child">
              <div class="prod-list__item__info">
                <div class="prod-list__item__info--title"><a href="./sanpham.html?id=${p._id}">${escapeHtml(p.name)}</a></div>
                <div class="prod-list__item__info--masp">${escapeHtml(p.category||'')}</div>
              </div>
              <div class="prod-list__item__info--price-fb">
                <div class="prod-list__item--price">
                  <span class="prod-list__item__info--price">${formatPrice(p.price)}</span>
                </div>
                <div class="prod-list__item__info--star-icon"><img class="info--star-icon" loading="lazy" alt="" src="./icon/star.svg"/><div class="prod-list__item__info--fb">4.3</div></div>
              </div>
            </div>
          </div>
        </section>
      `;
      dealsContainer.insertAdjacentHTML('beforeend', html);
    });
  }
  
  // Cập nhật bestseller section
  const bestGrid = document.querySelector('#home-bestseller-grid');
  if (bestGrid) {
    bestGrid.innerHTML = '';
    const best = products.slice(6, 12);
    best.forEach(p => {
      const html = `
        <section class="prod-list__item">
          <div class="prod-list__item__image">
            <a href="./sanpham.html?id=${p._id}"><img class="prod-list__item__img1" loading="lazy" alt="" src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}"/></a>
            <div class="button-heart-cart-hover">
              <button class="btn-heart" data-id="${p._id}" aria-label="Yêu thích"><img src="./icon/heart.svg"/></button>
              <button class="btn-cart add-to-cart-inline" data-id="${p._id}" aria-label="Thêm vào giỏ"><img src="./icon/cart.svg"/></button>
            </div>
          </div>
          <div class="prod-list__item__inner">
            <div class="prod-list__item__inner--child">
              <div class="prod-list__item__info">
                <div class="prod-list__item__info--title"><a href="./sanpham.html?id=${p._id}">${escapeHtml(p.name)}</a></div>
                <div class="prod-list__item__info--masp">${escapeHtml(p.category||'')}</div>
              </div>
              <div class="prod-list__item__info--price-fb">
                <div class="prod-list__item--price">
                  <span class="prod-list__item__info--price">${formatPrice(p.price)}</span>
                </div>
                <div class="prod-list__item__info--star-icon"><img class="info--star-icon" loading="lazy" alt="" src="./icon/star.svg"/><div class="prod-list__item__info--fb">4.3</div></div>
              </div>
            </div>
          </div>
        </section>
      `;
      bestGrid.insertAdjacentHTML('beforeend', html);
    });
  }
  
  console.log('✅ Đã cập nhật trang chủ với data mới từ database');
}

// Refresh trang danh mục
async function refreshCategoryPage() {
  if (typeof window.renderProductGrid === 'function') {
    // Gọi lại hàm renderProductGrid để fetch và render lại products
    await window.renderProductGrid();
    console.log('✅ Đã cập nhật danh mục với data mới từ database');
  } else {
    // Fallback: reload trang
    window.location.reload();
  }
}

// Refresh trang admin
async function refreshAdminPage() {
  if (typeof renderProducts === 'function') {
    // Gọi lại hàm renderProducts nếu có
    const qInput = document.getElementById('q');
    await renderProducts(qInput ? qInput.value : '');
    console.log('✅ Đã cập nhật trang admin với data mới từ database');
  } else {
    // Fallback: reload trang
    window.location.reload();
  }
}

// Refresh trang chi tiết sản phẩm
async function refreshProductDetailPage() {
  // Đối với trang chi tiết, tốt nhất là reload vì cần load lại thông tin đầy đủ
  window.location.reload();
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'success') {
  // Tạo element thông báo
  const notification = document.createElement('div');
  notification.className = 'socket-notification';
  
  // Icon theo loại thông báo
  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };
  
  // Màu nền theo loại
  const colors = {
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  notification.innerHTML = `<span style="margin-right: 8px;">${icons[type] || icons.success}</span>${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    max-width: 350px;
  `;
  
  document.body.appendChild(notification);
  
  // Tự động xóa sau 3 giây
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
