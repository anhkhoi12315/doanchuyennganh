// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('accessToken');

// API Helper với authentication
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ========== PRODUCT FUNCTIONS ==========

// Load tất cả sản phẩm với filter và pagination
async function loadProducts(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.material) params.append('material', filters.material);
    if (filters.style) params.append('style', filters.style);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);

    const data = await apiCall(`/products?${params.toString()}`);
    
    return data;
  } catch (error) {
    console.error('Error loading products:', error);
    throw error;
  }
}

// Load sản phẩm nổi bật
async function loadFeaturedProducts(limit = 8) {
  try {
    const data = await apiCall(`/products/featured?limit=${limit}`);
    return data.data;
  } catch (error) {
    console.error('Error loading featured products:', error);
    throw error;
  }
}

// Load sản phẩm bán chạy
async function loadBestSellers(limit = 10) {
  try {
    const data = await apiCall(`/products/best-sellers?limit=${limit}`);
    return data.data;
  } catch (error) {
    console.error('Error loading best sellers:', error);
    throw error;
  }
}

// Load sản phẩm mới
async function loadNewArrivals(limit = 10) {
  try {
    const data = await apiCall(`/products/new-arrivals?limit=${limit}`);
    return data.data;
  } catch (error) {
    console.error('Error loading new arrivals:', error);
    throw error;
  }
}

// Load chi tiết sản phẩm
async function loadProductDetail(productId) {
  try {
    const data = await apiCall(`/products/${productId}`);
    return data.data;
  } catch (error) {
    console.error('Error loading product detail:', error);
    throw error;
  }
}

// Load sản phẩm liên quan
async function loadRelatedProducts(productId) {
  try {
    const data = await apiCall(`/products/${productId}/related`);
    return data.data;
  } catch (error) {
    console.error('Error loading related products:', error);
    throw error;
  }
}

// ========== RENDER FUNCTIONS ==========

// Render product card
function renderProductCard(product) {
  const price = product.salePrice || product.price;
  const discount = product.salePrice 
    ? Math.round((1 - product.salePrice / product.price) * 100) 
    : 0;

  return `
    <div class="product-card" data-product-id="${product._id}">
      <div class="product-image">
        <a href="sanpham.html?id=${product._id}">
          <img src="${API_BASE_URL.replace('/api', '')}${product.images[0] || '/img/no-image.jpg'}" 
               alt="${product.name}">
        </a>
        ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
        ${product.stock === 0 ? '<span class="out-of-stock-badge">Hết hàng</span>' : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">
          <a href="sanpham.html?id=${product._id}">${product.name}</a>
        </h3>
        <div class="product-rating">
          ${renderStars(product.rating?.average || 0)}
          <span class="rating-count">(${product.rating?.count || 0})</span>
        </div>
        <div class="product-price">
          ${product.salePrice 
            ? `
              <span class="sale-price">${formatPrice(product.salePrice)}</span>
              <span class="original-price">${formatPrice(product.price)}</span>
            `
            : `<span class="price">${formatPrice(product.price)}</span>`
          }
        </div>
        <div class="product-actions">
          <button class="btn-add-cart" onclick="addToCart('${product._id}')" 
                  ${product.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
          </button>
          <button class="btn-wishlist" onclick="toggleWishlist('${product._id}')">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render stars
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i === fullStars && hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }

  return `<div class="stars">${stars}</div>`;
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

// ========== CART FUNCTIONS ==========

// Thêm vào giỏ hàng
async function addToCart(productId, quantity = 1) {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.location.href = 'dangnhap.html';
      return;
    }

    const data = await apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });

    alert('Đã thêm vào giỏ hàng!');
    updateCartCount();
    
    return data;
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// Cập nhật số lượng giỏ hàng trong header
async function updateCartCount() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const data = await apiCall('/cart');
    const count = data.data.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// ========== WISHLIST FUNCTIONS ==========

// Toggle wishlist
async function toggleWishlist(productId) {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng wishlist');
      window.location.href = 'dangnhap.html';
      return;
    }

    // Check if in wishlist
    const checkData = await apiCall(`/wishlist/check/${productId}`);
    
    if (checkData.data.isInWishlist) {
      // Remove from wishlist
      await apiCall(`/wishlist/${productId}`, { method: 'DELETE' });
      alert('Đã xóa khỏi danh sách yêu thích');
    } else {
      // Add to wishlist
      await apiCall('/wishlist/add', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
      alert('Đã thêm vào danh sách yêu thích');
    }
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

// ========== BEHAVIOR TRACKING ==========

// Track user behavior
async function trackBehavior(eventType, data = {}) {
  try {
    await apiCall('/behavior/track', {
      method: 'POST',
      body: JSON.stringify({
        eventType,
        ...data
      })
    });
  } catch (error) {
    // Silent fail - không ảnh hưởng UX
    console.error('Tracking error:', error);
  }
}

// Track product view
function trackProductView(productId) {
  trackBehavior('view', { productId });
}

// Track search
function trackSearch(query) {
  trackBehavior('search', { searchQuery: query });
}

// ========== USAGE EXAMPLES ==========

/*
// Ví dụ sử dụng trong trang index.html
document.addEventListener('DOMContentLoaded', async () => {
  // Load featured products
  const featured = await loadFeaturedProducts(8);
  const featuredContainer = document.querySelector('.featured-products');
  featuredContainer.innerHTML = featured.map(renderProductCard).join('');

  // Load best sellers
  const bestSellers = await loadBestSellers(10);
  const bestSellersContainer = document.querySelector('.best-sellers');
  bestSellersContainer.innerHTML = bestSellers.map(renderProductCard).join('');

  // Update cart count
  updateCartCount();
});

// Ví dụ sử dụng trong trang danhmuc.html
document.addEventListener('DOMContentLoaded', async () => {
  const filters = {
    page: 1,
    limit: 12,
    category: new URLSearchParams(window.location.search).get('category'),
    sort: '-createdAt'
  };

  const result = await loadProducts(filters);
  const productContainer = document.querySelector('.product-list');
  productContainer.innerHTML = result.data.map(renderProductCard).join('');

  // Render pagination
  renderPagination(result.pagination);
});

// Ví dụ sử dụng trong trang sanpham.html
document.addEventListener('DOMContentLoaded', async () => {
  const productId = new URLSearchParams(window.location.search).get('id');
  
  // Load product detail
  const product = await loadProductDetail(productId);
  renderProductDetail(product);

  // Track view
  trackProductView(productId);

  // Load related products
  const related = await loadRelatedProducts(productId);
  const relatedContainer = document.querySelector('.related-products');
  relatedContainer.innerHTML = related.map(renderProductCard).join('');
});
*/

// Export functions (nếu dùng modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadProducts,
    loadFeaturedProducts,
    loadBestSellers,
    loadNewArrivals,
    loadProductDetail,
    loadRelatedProducts,
    addToCart,
    toggleWishlist,
    trackBehavior,
    trackProductView,
    trackSearch,
    renderProductCard,
    formatPrice
  };
}
