// --------- Dynamic cart rendering and API integration ---------
document.addEventListener('DOMContentLoaded', async () => {
  // Clear local cart - we only use database now
  localStorage.removeItem('cart');
  
  if (!window.api) {
    console.error('[GioHang] window.api not loaded!');
    alert('Lỗi: Không thể tải giỏ hàng. Vui lòng tải lại trang.');
    return;
  }
  
  const cartTable = document.querySelector('.cart-items-tbody');
  const subtotalEl = document.querySelector('.cart-subtotal');
  const emptyMsg = document.querySelector('.cart-empty-msg');
  const cartSection = document.querySelector('.cart-table-wrapper');

  function updateSubtotal() {
    let total = 0;
    document.querySelectorAll('.cart-row').forEach(row => {
      const price = parseInt(row.getAttribute('data-price')) || 0;
      const qty = parseInt(row.getAttribute('data-qty')) || 0;
      total += price * qty;
    });
    subtotalEl.textContent = total.toLocaleString('vi-VN') + ' VNĐ';
  }

  async function renderCartServer() {
    try {
      if (!window.api || !window.api.getCart) {
        console.error('[GioHang] window.api.getCart not available');
        return;
      }
      const cart = await window.api.getCart();
      if (!cart || !cart.items || !cart.items.length) {
        if (cartTable) cartTable.innerHTML = '';
        if (subtotalEl) subtotalEl.textContent = '0 VNĐ';
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (cartSection) cartSection.style.display = 'none';
        window.initHeader && window.initHeader();
        return;
      }
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (cartSection) cartSection.style.display = 'block';

      const html = cart.items.map(it => {
        const p = it.product || {};
        const qty = it.quantity || it.qty || 1;
        const itemTotal = (it.price || 0) * qty;
        return `
          <tr class="cart-row" data-price="${it.price || 0}" data-qty="${qty}" data-product-id="${p._id}">
            <td class="cart-item-name">
              <div style="text-align:left; display:flex; gap:10px; align-items:center;">
                <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" 
                     alt="${p.name || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" />
                <span>${p.name || ''}</span>
              </div>
            </td>
            <td class="cart-item-price">${(it.price||0).toLocaleString('vi-VN')} VNĐ</td>
            <td>
              <div class="qty-control">
                <button class="qty-btn qty-minus" type="button">−</button>
                <input type="number" class="qty-input" value="${qty}" min="1" />
                <button class="qty-btn qty-plus" type="button">+</button>
              </div>
            </td>
            <td class="cart-item-total">${itemTotal.toLocaleString('vi-VN')} VNĐ</td>
            <td>
              <button class="remove-item-btn" data-product-id="${p._id}" style="background:#f86624; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:14px;">Xóa</button>
            </td>
          </tr>
        `;
      }).join('');
      if (cartTable) cartTable.innerHTML = html;

      // Attach event listeners
      document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const row = btn.closest('.cart-row');
          const input = row.querySelector('.qty-input');
          const productId = row.getAttribute('data-product-id');
          let newQty = parseInt(input.value) + 1;
          
          try {
            await window.api.authFetch('/cart/item/' + productId, {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQty })
            });
            await renderCartServer();
            window.initHeader && window.initHeader();
          } catch (err) {
            console.error('Lỗi cập nhật số lượng', err);
          }
        });
      });

      document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const row = btn.closest('.cart-row');
          const input = row.querySelector('.qty-input');
          const productId = row.getAttribute('data-product-id');
          let newQty = parseInt(input.value) - 1;
          
          if (newQty < 1) newQty = 1;
          
          try {
            await window.api.authFetch('/cart/item/' + productId, {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQty })
            });
            await renderCartServer();
            window.initHeader && window.initHeader();
          } catch (err) {
            console.error('Lỗi cập nhật số lượng', err);
          }
        });
      });

      document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', async (e) => {
          const row = input.closest('.cart-row');
          const productId = row.getAttribute('data-product-id');
          let newQty = parseInt(input.value) || 1;
          
          if (newQty < 1) newQty = 1;
          
          try {
            await window.api.authFetch('/cart/item/' + productId, {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQty })
            });
            await renderCartServer();
            window.initHeader && window.initHeader();
          } catch (err) {
            console.error('Lỗi cập nhật số lượng', err);
          }
        });
      });

      document.querySelectorAll('.remove-item-btn').forEach(b => {
        b.addEventListener('click', async (e) => {
          e.preventDefault();
          const productId = b.getAttribute('data-product-id');
          try {
            await window.api.authFetch('/cart/item/' + productId, { method: 'DELETE' });
            await renderCartServer();
            window.initHeader && window.initHeader();
          } catch (err) {
            console.error('Xóa mục lỗi', err);
          }
        });
      });

      updateSubtotal();
      window.initHeader && window.initHeader();
    } catch (err) {
      console.error('Error loading server cart', err);
    }
  }

  async function renderCartLocal() {
    if (!window.api || !window.api.getLocalCart) {
      console.error('[GioHang] window.api.getLocalCart not available');
      return;
    }
    const items = window.api.getLocalCart();
    if (!items || !items.length) {
      if (cartTable) cartTable.innerHTML = '';
      if (subtotalEl) subtotalEl.textContent = '0 VNĐ';
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (cartSection) cartSection.style.display = 'none';
      window.initHeader && window.initHeader();
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (cartSection) cartSection.style.display = 'block';

    let html = '';
    for (const it of items) {
      const p = await window.api.getProduct(it.productId);
      const itemTotal = (p.price || 0) * (it.qty || 1);
      html += `
        <tr class="cart-row" data-price="${p.price || 0}" data-qty="${it.qty || 1}" data-product-id="${it.productId}">
          <td class="cart-item-name">
            <div style="text-align:left; display:flex; gap:10px; align-items:center;">
              <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" 
                   alt="${p.name || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" />
              <span>${p.name || ''}</span>
            </div>
          </td>
          <td class="cart-item-price">${(p.price||0).toLocaleString('vi-VN')} VNĐ</td>
          <td>
            <div class="qty-control">
              <button class="qty-btn qty-minus" type="button">−</button>
              <input type="number" class="qty-input" value="${it.qty}" min="1" />
              <button class="qty-btn qty-plus" type="button">+</button>
            </div>
          </td>
          <td class="cart-item-total">${itemTotal.toLocaleString('vi-VN')} VNĐ</td>
          <td>
            <button class="remove-local-item-btn" data-id="${it.productId}" style="background:#f86624; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:14px;">Xóa</button>
          </td>
        </tr>
      `;
    }
    if (cartTable) cartTable.innerHTML = html;

    // Attach event listeners for local cart
    document.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const row = btn.closest('.cart-row');
        const productId = row.getAttribute('data-product-id');
        const items = window.api.getLocalCart();
        const item = items.find(i => i.productId === productId);
        if (item) {
          item.qty = (item.qty || 1) + 1;
          window.api.setLocalCart(items);
          await renderCartLocal();
          window.initHeader && window.initHeader();
        }
      });
    });

    document.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const row = btn.closest('.cart-row');
        const productId = row.getAttribute('data-product-id');
        const items = window.api.getLocalCart();
        const item = items.find(i => i.productId === productId);
        if (item && item.qty > 1) {
          item.qty = item.qty - 1;
          window.api.setLocalCart(items);
          await renderCartLocal();
          window.initHeader && window.initHeader();
        }
      });
    });

    document.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const row = input.closest('.cart-row');
        const productId = row.getAttribute('data-product-id');
        const items = window.api.getLocalCart();
        const item = items.find(i => i.productId === productId);
        let newQty = parseInt(input.value) || 1;
        if (newQty < 1) newQty = 1;
        if (item) {
          item.qty = newQty;
          window.api.setLocalCart(items);
          await renderCartLocal();
          window.initHeader && window.initHeader();
        }
      });
    });

    document.querySelectorAll('.remove-local-item-btn').forEach(b => {
      b.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = b.getAttribute('data-id');
        const items = window.api.getLocalCart().filter(i => i.productId !== id);
        window.api.setLocalCart(items);
        await renderCartLocal();
        window.initHeader && window.initHeader();
      });
    });

    updateSubtotal();
    window.initHeader && window.initHeader();
  }

  const token = window.api.getToken && window.api.getToken();
  if (token) await renderCartServer();
  else await renderCartLocal();

  // Clear cart button
  const clearBtn = document.querySelector('.clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const token = window.api.getToken && window.api.getToken();
      if (token) {
        try {
          await window.api.authFetch('/cart/clear', { method: 'DELETE' });
          await renderCartServer();
        } catch (err) { console.error('Lỗi khi xóa giỏ hàng', err); }
      } else {
        window.api.clearLocalCart && window.api.clearLocalCart();
        await renderCartLocal();
      }
      window.initHeader && window.initHeader();
    });
  }
});

function toggleCheckboxes() {
  var checkboxes = document.querySelectorAll(
    '.product-detail input[type="checkbox"]'
  );
  var masterCheckbox = document.getElementById("checkAll");

  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = masterCheckbox.checked;
  }
}

function darkFunction() {
  const element = document.body;
  element.classList.toggle("dark-mode");
  // Đổi ảnh marquee chỉ khi bật dark-mode
  const imageReturn = document.querySelector(".return img");
  const imagePayment = document.querySelector(".payment img");
  const imageGuarantee = document.querySelector(".guarantee img");
  const imageDelivery = document.querySelector(".delivery img");
}

function toggleSizeList() {
  var sizeList = document.getElementById("sizeList");
  sizeList.style.display = sizeList.style.display === "none" ? "block" : "none";
}

function selectSize() {
  var sizeSelect = document.getElementById("sizeSelect");
  var selectedSize = sizeSelect.value;
  displaySelectedSize(selectedSize);
}

function setSize(size) {
  var sizeSelect = document.getElementById("sizeSelect");
  sizeSelect.value = size;
  displaySelectedSize(size);
  toggleSizeList();
}

function displaySelectedSize(size) {
  var selectedSizeElement = document.querySelector(".selected-size");
  selectedSizeElement.textContent = size !== "" ? size : "Chọn size";
}

function toggleSizeList2() {
  var sizeList2 = document.getElementById("sizeList2");
  sizeList2.style.display =
    sizeList2.style.display === "none" ? "block" : "none";
}

function selectSize2() {
  var sizeSelect2 = document.getElementById("sizeSelect2");
  var selectedSize2 = sizeSelect2.value;
  displaySelectedSize2(selectedSize2);
}

function setSize2(size) {
  var sizeSelect2 = document.getElementById("sizeSelect2");
  sizeSelect2.value = size;
  displaySelectedSize2(size);
  toggleSizeList2();
}

function displaySelectedSize2(size) {
  var selectedSize2Element = document.querySelector(".selected-size");
  selectedSize2Element.textContent = size !== "" ? size : "Chọn size";
}

function toggleSizeList3() {
  var sizeList3 = document.getElementById("sizeList3");
  sizeList3.style.display =
    sizeList3.style.display === "none" ? "block" : "none";
}

function selectSize3() {
  var sizeSelect3 = document.getElementById("sizeSelect3");
  var selectedSize3 = sizeSelect3.value;
  displaySelectedSize3(selectedSize3);
}

function setSize3(size) {
  var sizeSelect3 = document.getElementById("sizeSelect3");
  sizeSelect3.value = size;
  displaySelectedSize3(size);
  toggleSizeList3();
}

function displaySelectedSize3(size) {
  var selectedSize3Element = document.querySelector(".selected-size");
  selectedSize3Element.textContent = size !== "" ? size : "Chọn size";
}

function toggleSizeList4() {
  var sizeList4 = document.getElementById("sizeList4");
  sizeList4.style.display =
    sizeList4.style.display === "none" ? "block" : "none";
}

function selectSize4() {
  var sizeSelect4 = document.getElementById("sizeSelect4");
  var selectedSize4 = sizeSelect4.value;
  displaySelectedSize4(selectedSize4);
}

function setSize4(size) {
  var sizeSelect4 = document.getElementById("sizeSelect4");
  sizeSelect4.value = size;
  displaySelectedSize4(size);
  toggleSizeList4();
}

function displaySelectedSize4(size) {
  var selectedSize4Element = document.querySelector(".selected-size");
  selectedSize4Element.textContent = size !== "" ? size : "Chọn size";
}

// Load similar products for cart page
async function loadSimilarProducts() {
  try {
    if (!window.api || !window.api.BASE_URL) return;
    // Load featured products as similar products
    const response = await fetch(window.api.BASE_URL + '/products/featured');
    const data = await response.json();
    const products = data.products || [];
    
    const productHome = document.querySelector('.similar-container .product-home');
    if (!productHome) return;
    
    if (products.length === 0) {
      productHome.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Không có sản phẩm nào</p>';
      return;
    }
    
    productHome.innerHTML = products.slice(0, 4).map(p => `
      <div class="product-item">
        <div class="product-card">
          <div class="product-card__img-wrap">
            <a href="./sanpham.html?id=${p._id}">
              <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" 
                   alt="${escapeHtml(p.name)}" class="product-card__thumb" />
            </a>
            <button class="like-btn">
              <img src="./icon/heart.svg" alt="" class="like-icon icon" onclick="heart(this)" />
            </button>
          </div>
          <h3 class="product-card__title">
            <a href="./sanpham.html?id=${p._id}">${escapeHtml(p.name)}</a>
          </h3>
          <p class="product-card__collection">${escapeHtml(p.category?.name || 'Trang sức')}</p>
          <div class="product-card__row">
            <span class="product-card__price">${formatPrice(p.salePrice || p.price)}</span>
            ${p.salePrice ? `<span class="product-card__price-sales">${formatPrice(p.price)}</span>` : ''}
            <img src="./icon/star.svg" alt="" class="product-card__star" />
            <span class="product-card__score">${p.rating || 4.5}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading similar products:', err);
  }
}

// Helper functions
function escapeHtml(text) {
  if (!text) return '';
  const str = typeof text === 'object' ? (text.name || String(text)) : String(text);
  return str.replace(/[&"'<>]/g, function(a) {
    return {'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a];
  });
}

function formatPrice(price) {
  if (!price) return '0 VNĐ';
  return parseInt(price).toLocaleString('vi-VN') + ' VNĐ';
}

// Load similar products when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSimilarProducts);
} else {
  loadSimilarProducts();
}

// Click heart icon
function heart(hinhDuocClick) {
  hinhDuocClick.classList.toggle("active");

  if (hinhDuocClick.classList.contains("active")) {
    hinhDuocClick.src = "./icon/heart-red.svg";
    IncreaseWL();
  } else {
    hinhDuocClick.src = "./icon/heart.svg";
    DecreaseWL();
  }
}

// Click "-"
function DecreaseWL() {
  var count = parseInt(document.getElementById("wishlist").innerHTML);
  if (count > 0) {
    count--;
    document.getElementById("wishlist").innerHTML = count;
  }
}
//Click "+"
function IncreaseWL() {
  var count = parseInt(document.getElementById("wishlist").innerHTML);
  count++;
  document.getElementById("wishlist").innerHTML = count;
}
