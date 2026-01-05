// Helper functions
function escapeHtml(text) {
  if (!text) return '';
  // Convert to string if it's an object
  const str = typeof text === 'object' ? (text.name || String(text)) : String(text);
  return str.replace(/[&"'<>]/g, function(a){
    return {'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a];
  });
}

function formatPrice(n){ 
  return (n||0).toLocaleString('vi-VN') + ' VNĐ'; 
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Home] DOMContentLoaded fired');
  console.log('[Home] window.api available:', !!window.api);
  
  if (!window.api) {
    console.warn('[Home] window.api not loaded - keeping static products');
    return;
  }
  
  // Load Featured Products (Deals)
  const container = document.querySelector('#home-deals-grid');
  console.log('[Home] Container found:', !!container);
  
  if (container) {
    try {
      console.log('[Home] Fetching featured products from:', window.api.BASE_URL + '/products/featured');
      const response = await fetch(window.api.BASE_URL + '/products/featured', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[Home] Response status:', response.status);
      
      if (!response.ok) {
        console.error('[Home] API response error:', response.status, response.statusText);
        container.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#e74c3c;">❌ Không thể tải sản phẩm. Vui lòng kiểm tra server.</p></div>';
        return;
      }
      
      const data = await response.json();
      console.log('[Home] Data received:', data);
      const deals = data.products || [];
      
      if (deals.length === 0) {
        console.warn('[Home] No featured products returned');
        container.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#999;">Chưa có sản phẩm nổi bật</p></div>';
        return;
      }
      
      console.log('[Home] Loading', deals.length, 'featured products from API');
      container.innerHTML = ''; // Clear loading message
      
      deals.slice(0, 6).forEach(p => {
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
      container.insertAdjacentHTML('beforeend', html);
    });
    } catch (err) {
      console.error('[Home] Error loading featured products:', err);
      if (container) {
        container.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#e74c3c;">❌ Lỗi: ' + err.message + '</p></div>';
      }
    }
  }

  // Bestseller section
  const bestGrid = document.querySelector('#home-bestseller-grid');
  if (bestGrid) {
    try {
      console.log('[Home] Fetching bestsellers from:', window.api.BASE_URL + '/products/best-sellers');
      const response = await fetch(window.api.BASE_URL + '/products/best-sellers');
      
      if (!response.ok) {
        console.error('[Home] Bestsellers API response error:', response.status);
        bestGrid.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#999;">Không thể tải bestsellers</p></div>';
        return;
      }
      const data = await response.json();
      const bestsellers = data.products || [];
      
      if (bestsellers.length === 0) {
        console.warn('[Home] No bestsellers returned');
        bestGrid.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#999;">Chưa có bestsellers</p></div>';
        return;
      }
      
      console.log('[Home] Loading', bestsellers.length, 'bestsellers from API');
      bestGrid.innerHTML = '';
      
      bestsellers.slice(0, 6).forEach(p => {
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
              <div cl[Home] Error loading bestsellers:', err);
      // Keep static products on error
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
    } catch (err) {
      console.error('[Home] Error loading bestsellers:', err);
      if (bestGrid) {
        bestGrid.innerHTML = '<div style="text-align:center;padding:40px;width:100%;"><p style="color:#e74c3c;">❌ Lỗi: ' + err.message + '</p></div>';
      }
    }
  }

  // Add to cart functionality for both grids
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('.add-to-cart-inline');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const token = window.api.getToken && window.api.getToken();
    
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.location.href = './dangnhap.html';
      return;
    }
    
    try {
      await window.api.addToCart(id, 1);
      alert('Đã thêm vào giỏ hàng');
      window.initHeader && window.initHeader();
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Có lỗi xảy ra');
    }
  });

  // Add to wishlist functionality for both grids
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-heart');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const token = window.api.getToken && window.api.getToken();
    
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      window.location.href = './dangnhap.html';
      return;
    }
    
    try {
      const data = await window.api.authFetch('/wishlist/add', {
        method: 'POST',
        body: JSON.stringify({ productId: id })
      });
      
      if (data.success) {
        alert('✅ Đã thêm vào danh sách yêu thích!');
        window.initHeader && window.initHeader();
      } else {
        alert(data.message || 'Không thể thêm vào danh sách yêu thích');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      alert('❌ Có lỗi xảy ra: ' + err.message);
    }
  });
});
