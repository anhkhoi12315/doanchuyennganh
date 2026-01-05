// ===== WISHLIST PAGE - LOAD FROM API =====
document.addEventListener('DOMContentLoaded', async () => {
  await renderWishlist();
  setupButtons();
});

async function renderWishlist() {
  const grid = document.querySelector('.product-grid');
  const countEl = document.querySelector('.favorites-count');
  
  if (!grid) return;
  
  if (!window.api) {
    console.error('[YeuThich] window.api not loaded');
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#f00;"><p>Lỗi: Không thể kết nối API</p></div>';
    return;
  }
  
  const token = window.api.getToken && window.api.getToken();
  if (!token) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;"><p>Vui lòng <a href="./dangnhap.html">đăng nhập</a> để xem danh sách yêu thích</p></div>';
    if (countEl) countEl.textContent = '0 sản phẩm';
    return;
  }
  
  try {
    const responseData = await window.api.authFetch('/wishlist');
    const wishlist = responseData.data || responseData;
    const wishlistItems = wishlist.products || [];
    
    if (countEl) countEl.textContent = `${wishlistItems.length} sản phẩm trong danh sách yêu thích của bạn`;
    
    if (!wishlistItems.length) {
      grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><p>📝 Danh sách yêu thích trống</p><p><a href="./danhmuc.html" class="btn" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#f86624;color:white;text-decoration:none;border-radius:6px;">Khám phá sản phẩm</a></p></div>';
      return;
    }
    
    const htmlParts = wishlistItems.map(item => {
      const p = item.product;
      if (!p) return '';
      
      return `
          <article class="product-column" data-id="${p._id}">
            <div class="delete-icon"><button class="delete-btn" data-id="${p._id}"><img src="./icon/yeuthich-delete.svg" alt="Xóa" /> <span>Xóa</span></button></div>
            <div class="product-card">
              <div class="product-image-wrapper">
                <figure class="product-image">
                  <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" alt="${p.name||''}" />
                </figure>
                <h3 class="product-name">${p.name || ''}</h3>
                <p class="product-DM">${p.category || ''}</p>
                <div class="product-info">
                  <span class="product-price">${formatPrice(p.price)}</span>
                  <div class="product-rating"><span class="star-icon">★</span> 4.3</div>
                </div>
              </div>
            <button class="add-to-cart-btn" data-id="${p._id}">Thêm vào giỏ hàng</button>
          </div>
        </article>
      `;
    });
    
    grid.innerHTML = htmlParts.join('');
    
    // Attach delete handlers
    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const productId = btn.getAttribute('data-id');
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) return;
        
        try {
          await window.api.authFetch('/wishlist/' + productId, { method: 'DELETE' });
          alert('✅ Đã xóa khỏi danh sách yêu thích');
          renderWishlist();
        } catch (err) {
          console.error('Error removing from wishlist:', err);
          alert('❌ Có lỗi xảy ra');
        }
      });
    });
    
    // Attach add to cart handlers
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const productId = btn.getAttribute('data-id');
        
        try {
          await window.api.addToCart(productId, 1);
          alert('✅ Đã thêm vào giỏ hàng!');
          window.initHeader && window.initHeader();
        } catch (err) {
          console.error('Error adding to cart:', err);
          alert('❌ Có lỗi xảy ra');
        }
      });
    });
    
  } catch (err) {
    console.error('Error loading wishlist:', err);
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><p>❌ Không thể tải danh sách yêu thích</p></div>';
  }
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

function setupButtons() {
  // Add all to cart button
  const addAllBtn = document.querySelector('.add-to-cart-button');
  if (addAllBtn) {
    addAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        const responseData = await window.api.authFetch('/wishlist');
        const wishlist = responseData.data || responseData;
        const wishlistItems = wishlist.products || [];
        
        if (!wishlistItems.length) {
          alert('Không có sản phẩm trong danh sách yêu thích');
          return;
        }
        
        let successCount = 0;
        // Add all to cart
        for (const item of wishlistItems) {
          try {
            await window.api.addToCart(item.product._id, 1);
            successCount++;
          } catch (err) {
            console.error('Error adding product to cart:', err);
          }
        }
        
        alert(`✅ Đã thêm ${successCount}/${wishlistItems.length} sản phẩm vào giỏ hàng!`);
        window.initHeader && window.initHeader();
        
      } catch (err) {
        console.error('Error:', err);
        alert('❌ Có lỗi xảy ra');
      }
    });
  }
  
  // Clear list button
  const clearBtn = document.querySelector('.clear-list-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!confirm('Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?')) return;
      
      try {
        console.log('[Clear] Calling API...');
        const response = await window.api.authFetch('/wishlist/clear', { method: 'DELETE' });
        console.log('[Clear] Response:', response);
        alert('✅ Đã xóa toàn bộ danh sách yêu thích');
        await renderWishlist();
        window.initHeader && window.initHeader();
      } catch (err) {
        console.error('[Clear] Error:', err);
        alert('❌ Có lỗi xảy ra: ' + err.message);
      }
    });
  } else {
    console.error('[Setup] Clear button not found!');
  }
}
   

      

    




  