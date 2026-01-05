// Hàm render products - có thể gọi từ bên ngoài để refresh
async function renderProductGrid() {
  if (!window.api || !window.api.getProducts) return;

  const products = await window.api.getProducts();
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  grid.innerHTML = '';
  products.forEach(p => {
    const article = document.createElement('article');
    article.className = 'product-column';
    article.innerHTML = `
      <div class="product-card">
        <div class="product-image-wrapper">
          <figure class="product-image">
            <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" alt="${escapeHtml(p.name)}" />
          </figure>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-DM">${escapeHtml(p.category || '')}</p>
          <div class="product-info">
            <span class="product-price">${formatPrice(p.price)}</span>
            <div class="product-rating">
              <span class="star-icon">★</span> 4.3
            </div>
          </div>
        </div>
        <button class="add-to-cart-btn" data-id="${p._id}">Thêm vào giỏ hàng</button>
      </div>
    `;

    grid.appendChild(article);
  });
}

// Export hàm để có thể gọi từ socketClient
window.renderProductGrid = renderProductGrid;

document.addEventListener('DOMContentLoaded', async () => {
  // Render lần đầu
  await renderProductGrid();

  // Add event listener for add to cart
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;

    // If user is logged in (token exists), call API addToCart
    const token = window.api.getToken && window.api.getToken();
    if (token) {
      try {
        const result = await window.api.addToCart(id, 1);
        console.log('[Products] Added to cart:', result);
        alert('Đã thêm vào giỏ hàng');
        window.initHeader && window.initHeader();
      } catch (err) {
        console.error('[Products] Error adding to cart:', err);
        alert('Lỗi thêm vào giỏ hàng');
      }
    } else {
      // Add to local cart
      window.api.addToLocalCart && window.api.addToLocalCart(id, 1);
      alert('Bạn chưa đăng nhập — sản phẩm được lưu tạm vào giỏ hàng (đăng nhập để gộp)');
      window.initHeader && window.initHeader();
    }
  });

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&"'<>]/g, function(a){
      return {'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a];
    });
  }

  function formatPrice(n){
    return (n||0).toLocaleString('vi-VN') + ' VNĐ';
  }
});
