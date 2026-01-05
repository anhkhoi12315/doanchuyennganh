// ===== LOAD PRODUCT DETAIL FROM API - NO STATIC DATA =====
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const productSlug = urlParams.get('slug');
  
  if (!productId && !productSlug) {
    alert('Không tìm thấy sản phẩm');
    window.location.href = './danhmuc.html';
    return;
  }
  
  if (!window.api || !window.api.BASE_URL) {
    console.error('[SanPham] window.api not loaded!');
    alert('Lỗi: Không thể kết nối API. Vui lòng tải lại trang.');
    return;
  }
  
  // Ưu tiên slug, fallback về id
  const identifier = productSlug || productId;
  const useSlug = !!productSlug;
  
  await loadProductDetail(identifier, useSlug);
  await loadRelatedProducts(identifier);
  await loadProductReviews(identifier);
  setupAddToCart(identifier);
  
  // Track product view
  trackBehavior('view', identifier);
});

// Load product detail
async function loadProductDetail(identifier, useSlug = false) {
  try {
    if (!window.api || !window.api.BASE_URL) {
      console.error('[SanPham] window.api not available');
      return;
    }
    
    // Tạo URL dựa vào slug hay id
    const url = useSlug 
      ? window.api.BASE_URL + '/products/slug/' + identifier
      : window.api.BASE_URL + '/products/' + identifier;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Product not found');
    
    const responseData = await response.json();
    const product = responseData.data || responseData;
    
    // Update page title
    document.title = product.name + ' - Bán Trang Sức';
    
    // Update product images
    const mainImage = document.querySelector('.product-inf__image1');
    if (mainImage && product.images && product.images[0]) {
      mainImage.src = product.images[0];
      mainImage.alt = product.name;
    }
    
    // Update thumbnail gallery
    const thumbGallery = document.querySelector('.product-inf__image-small');
    if (thumbGallery && product.images) {
      thumbGallery.innerHTML = product.images.map((img, idx) => `
        <img src="${img}" alt="${product.name}" class="product-inf__image3" 
             onclick="changeMainImage('${img}')" />
      `).join('');
    }
    
    // Update product info
    const nameEl = document.querySelector('.product-inf__title');
    if (nameEl) nameEl.textContent = product.name;
    
    const priceEl = document.querySelector('.product-price');
    if (priceEl) {
      if (product.salePrice) {
        priceEl.innerHTML = `
          <span class="product-inf__price">${formatPrice(product.salePrice)}</span>
          <span class="product-inf__price-sales">${formatPrice(product.price)}</span>
        `;
      } else {
        priceEl.innerHTML = `<span class="product-inf__price">${formatPrice(product.price)}</span>`;
      }
    }
    
    const descEl = document.querySelector('.product-description, .description-content');
    if (descEl) descEl.textContent = product.description || 'Chưa có mô tả';
    
    // Update specs
    const specsEl = document.querySelector('.product-specs, .specifications');
    if (specsEl) {
      specsEl.innerHTML = `
        <div class="spec-item"><strong>Chất liệu:</strong> ${getMaterialName(product.material)}</div>
        <div class="spec-item"><strong>Phong cách:</strong> ${getStyleName(product.style)}</div>
        ${product.weight ? `<div class="spec-item"><strong>Trọng lượng:</strong> ${product.weight}g</div>` : ''}
        <div class="spec-item"><strong>Tình trạng:</strong> ${product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</div>
        <div class="spec-item"><strong>Đã bán:</strong> ${product.sold || 0} sản phẩm</div>
      `;
    }
    
    // Update rating
    const ratingEl = document.querySelector('.product-rating, .rating');
    if (ratingEl) {
      ratingEl.innerHTML = `
        <span class="stars">★★★★★</span>
        <span class="rating-value">${product.rating || 4.5}</span>
        <span class="review-count">(${product.reviewCount || 0} đánh giá)</span>
      `;
    }
    
    // Store product in window for add to cart
    window.currentProduct = product;
    
  } catch (err) {
    console.error('Error loading product:', err);
    alert('Không thể tải thông tin sản phẩm');
    window.location.href = './danhmuc.html';
  }
}

// Load related products
async function loadRelatedProducts(productId) {
  try {
    if (!window.api || !window.api.BASE_URL) return;
    const response = await fetch(window.api.BASE_URL + '/products/' + productId + '/related');
    const data = await response.json();
    const products = data.products || [];
    
    const relatedGrid = document.querySelector('.product-home');
    if (!relatedGrid) {
      console.warn('[SanPham] Related products container not found');
      return;
    }
    
    if (products.length === 0) {
      relatedGrid.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Không có sản phẩm tương tự</p>';
      return;
    }
    
    relatedGrid.innerHTML = products.slice(0, 4).map(p => `
      <div class="product-item">
        <div class="product-card">
          <div class="product-card__img-wrap">
            <a href="./sanpham.html?id=${p._id}">
              <img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" 
                   alt="${escapeHtml(p.name)}" class="product-card__thumb" />
            </a>
            <div class="button-heart-cart-hover">
              <a href="#!">
                <img src="./icon/heart.svg" alt="" class="prod-list__item__image--heart-hover" onclick="heart(this)" />
              </a>
              <a href="./sanpham.html?id=${p._id}">
                <img src="./icon/cart.svg" alt="" class="prod-list__item__image--cart-hover" />
              </a>
            </div>
          </div>
          <div class="prod-list__item__inner">
            <h3 class="product-card__title">
              <a href="./sanpham.html?id=${p._id}">${escapeHtml(p.name)}</a>
            </h3>
            <p class="product-card__collection">${escapeHtml(p.category?.name || 'Trang sức')}</p>
            <div class="product-card__row">
              <span class="product-card__price">${formatPrice(p.salePrice || p.price)}</span>
              ${p.salePrice ? `<span class="product-card__price-sales">${formatPrice(p.price)}</span>` : ''}
              <div class="prod-list__item__info--star-icon">
                <img src="./icon/sanpham-star.svg" alt="" class="product-card__star" />
                <span class="product-card__score">${p.rating || 4.5}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading related products:', err);
    const relatedGrid = document.querySelector('.product-home');
    if (relatedGrid) {
      relatedGrid.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Không thể tải sản phẩm tương tự</p>';
    }
  }
}

// Load product reviews
async function loadProductReviews(productId) {
  try {
    if (!window.api || !window.api.BASE_URL) return;
    const response = await fetch(window.api.BASE_URL + '/reviews/product/' + productId);
    const data = await response.json();
    const reviews = data.reviews || [];
    
    const reviewsContainer = document.querySelector('.reviews-list, .product-reviews');
    if (!reviewsContainer) return;
    
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Chưa có đánh giá nào</p>';
      return;
    }
    
    reviewsContainer.innerHTML = reviews.map(r => `
      <div class="review-item" style="border-bottom:1px solid #eee;padding:15px 0;">
        <div class="review-header" style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <strong>${escapeHtml(r.user?.fullname || 'Khách hàng')}</strong>
          <span class="review-date" style="color:#999;font-size:14px;">${formatDate(r.createdAt)}</span>
        </div>
        <div class="review-rating" style="color:#f39c12;margin-bottom:8px;">
          ${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}
        </div>
        <p class="review-comment">${escapeHtml(r.comment)}</p>
        ${r.isVerifiedPurchase ? '<span style="color:#27ae60;font-size:12px;">✓ Đã mua hàng</span>' : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

// Setup add to cart
function setupAddToCart(productId) {
  const quantityInput = document.querySelector('.quantity-input, input[name="quantity"]');
  const addToCartBtn = document.querySelector('#btn-add-to-cart, .btn-add-to-cart, .add-to-cart-btn');
  
  // Quantity controls
  const btnDecrease = document.querySelector('.btn-decrease, .qty-minus');
  const btnIncrease = document.querySelector('.btn-increase, .qty-plus');
  
  if (btnDecrease) {
    btnDecrease.addEventListener('click', () => {
      if (quantityInput) {
        const val = parseInt(quantityInput.value) || 1;
        if (val > 1) quantityInput.value = val - 1;
      }
    });
  }
  
  if (btnIncrease) {
    btnIncrease.addEventListener('click', () => {
      if (quantityInput) {
        const val = parseInt(quantityInput.value) || 1;
        const stock = window.currentProduct?.stock || 999;
        const maxQty = Math.min(stock, 10); // Giới hạn tối đa 10 cái
        if (val < maxQty) {
          quantityInput.value = val + 1;
        } else if (val >= 10) {
          alert('Mỗi sản phẩm chỉ được mua tối đa 10 cái!');
        } else {
          alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
        }
      }
    });
  }
  
  // Validate quantity input
  if (quantityInput) {
    quantityInput.addEventListener('input', () => {
      const val = parseInt(quantityInput.value) || 1;
      const stock = window.currentProduct?.stock || 999;
      const maxQty = Math.min(stock, 10); // Giới hạn tối đa 10
      
      if (val < 1) {
        quantityInput.value = 1;
      } else if (val > 10) {
        quantityInput.value = 10;
        alert('Mỗi sản phẩm chỉ được mua tối đa 10 cái!');
      } else if (val > stock) {
        quantityInput.value = stock;
        alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
      }
    });
    
    quantityInput.addEventListener('blur', () => {
      if (!quantityInput.value || parseInt(quantityInput.value) < 1) {
        quantityInput.value = 1;
      }
    });
  }
  
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      
      const quantity = parseInt(quantityInput?.value || 1);
      const stock = window.currentProduct?.stock || 999;
      
      // Validate quantity limit
      if (quantity > 10) {
        alert('Mỗi sản phẩm chỉ được mua tối đa 10 cái!');
        if (quantityInput) quantityInput.value = 10;
        return;
      }
      
      // Validate stock
      if (quantity > stock) {
        alert(`Chỉ còn ${stock} sản phẩm trong kho! Vui lòng giảm số lượng.`);
        if (quantityInput) quantityInput.value = stock;
        return;
      }
      
      if (stock <= 0) {
        alert('Sản phẩm đã hết hàng!');
        return;
      }
      
      try {
        const token = window.api.getToken && window.api.getToken();
        if (token) {
          await window.api.addToCart(productId, quantity);
          alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
          window.initHeader && window.initHeader();
        } else {
          window.api.addToLocalCart && window.api.addToLocalCart(productId, quantity);
          alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng! Vui lòng đăng nhập để đồng bộ.`);
          window.initHeader && window.initHeader();
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
        alert('Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    });
  }
}

// Change main image on thumbnail click
function changeMainImage(imgSrc) {
  const mainImage = document.querySelector('.product-inf__image1');
  if (mainImage) mainImage.src = imgSrc;
}

// Helper functions
function getMaterialName(material) {
  const map = {
    gold: 'Vàng',
    silver: 'Bạc',
    diamond: 'Kim cương',
    pearl: 'Ngọc trai',
    gemstone: 'Đá quý',
    platinum: 'Bạch kim'
  };
  return map[material] || material || 'Chưa rõ';
}

function getStyleName(style) {
  const map = {
    classic: 'Cổ điển',
    modern: 'Hiện đại',
    luxury: 'Sang trọng',
    minimalist: 'Tối giản',
    vintage: 'Cổ điển'
  };
  return map[style] || style || 'Chưa rõ';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function escapeHtml(text) {
  if (!text) return '';
  const str = typeof text === 'object' ? (text.name || String(text)) : String(text);
  return str.replace(/[&"'<>]/g, (a) => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a]));
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

// Click "-"
function Decrease() {
  var count = parseInt(document.getElementById("count").innerHTML);
  if (count > 0) {
    count--;
    document.getElementById("count").innerHTML = count;
  }
}
//Click "+"
function Increase() {
  var count = parseInt(document.getElementById("count").innerHTML);
  count++;
  document.getElementById("count").innerHTML = count;
}

function darkFunction() {
  const element = document.body;
  element.classList.toggle("dark-mode");
  // Đổi ảnh marquee chỉ khi bật dark-mode
  const imageReturn = document.querySelector(".return img");
  const imagePayment = document.querySelector(".payment img");
  const imageGuarantee = document.querySelector(".guarantee img");
  const imageDelivery = document.querySelector(".delivery img");
  //Đổi màu shadow của imgWrap khi qua dark mode
  const imgWrapShadows = document.querySelectorAll(".product-card");
  if (element.classList.contains("dark-mode")) {
    imageReturn.src = "./icon/sanpham-return-dark.svg";
    imagePayment.src = "./icon/sanpham-payment-dark.svg";
    imageGuarantee.src = "./icon/sanpham-guarantee-dark.svg";
    imageDelivery.src = "./icon/sanpham-delivery-dark.svg";
    imgWrapShadows.forEach((element) => {
      element.style.boxShadow = "0px 20px 60px 0px rgba(0, 0, 0, 0.2)";
    });
  } else {
    imageReturn.src = "./icon/sanpham-return.svg";
    imagePayment.src = "./icon/sanpham-payment.svg";
    imageGuarantee.src = "./icon/sanpham-guarantee.svg";
    imageDelivery.src = "./icon/sanpham-delivery.svg";
    imgWrapShadows.forEach((element) => {
      element.style.boxShadow = "0px 60px 20px 0px rgba(237, 237, 246, 0.20)";
    });
  }
}
function openModal() {
  var modal = document.getElementById("myModal");
  modal.style.display = "block";
}

function closeModal() {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
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
function validateStar() {
  var starInput = document.getElementById("reviewStar").value;
  var starError = document.getElementById("starError");

  // Chuyển đổi giá trị nhập vào thành số
  var starValue = parseFloat(starInput);

  // Kiểm tra xem giá trị có nằm trong khoảng từ 1 đến 5 không
  if (
    starValue < 1 ||
    starValue > 5 ||
    !Number.isInteger(parseFloat(starValue))
  ) {
    starError.textContent = "Vui lòng nhập một số nguyên từ 1 đến 5";
  } else {
    starError.textContent = ""; // Xóa thông báo lỗi nếu hợp lệ
  }
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

// ===== BEHAVIOR TRACKING =====
async function trackBehavior(action, productId, metadata = {}) {
  try {
    if (!window.api.isLoggedIn()) return; // Only track for logged-in users
    
    await window.api.authFetch('/behavior/track', {
      method: 'POST',
      body: JSON.stringify({
        action,
        productId,
        metadata
      })
    });
  } catch (err) {
    console.error('Track behavior error:', err);
    // Silent fail - don't disrupt user experience
  }
}
