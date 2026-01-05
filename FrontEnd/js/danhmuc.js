// ===== LOAD PRODUCTS FROM API - NO STATIC DATA =====
let currentSort = '-createdAt'; // Default sort
let currentPage = 1;
let totalPages = 1;
let allProducts = [];
const PRODUCTS_PER_PAGE = 12;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DanhMuc] DOMContentLoaded fired');
  console.log('[DanhMuc] window.api available:', !!window.api);
  
  if (!window.api || !window.api.BASE_URL) {
    console.error('[DanhMuc] window.api not loaded!');
    alert('Lỗi: Không thể kết nối API. Vui lòng tải lại trang.');
    return;
  }
  
  console.log('[DanhMuc] Starting to load data...');
  await loadCategories();
  await loadProducts();
  setupFilters();
});

// Load categories from API
async function loadCategories() {
  try {
    const response = await fetch(window.api.BASE_URL + '/categories');
    const categories = await response.json();
    
    const categoryList = document.querySelector('.category-list');
    if (categoryList) {
      categoryList.innerHTML = '<li><a href="#" data-category="all" class="active">Tất cả</a></li>';
      categories.forEach(cat => {
        categoryList.innerHTML += `<li><a href="#" data-category="${cat._id}">${cat.name}</a></li>`;
      });
      
      // Category filter click
      categoryList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          categoryList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
          link.classList.add('active');
          const catId = link.getAttribute('data-category');
          await loadProducts(catId === 'all' ? null : catId);
        });
      });
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// Load products from API with filters
async function loadProducts(categoryId = null, search = '', sort = '', minPrice = '', maxPrice = '') {
  try {
    let url = window.api.BASE_URL + '/products?';
    if (categoryId) url += `category=${categoryId}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (sort) url += `sort=${sort}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    url += 'limit=100'; // Lấy nhiều sản phẩm để phân trang client-side
    
    const response = await fetch(url);
    const data = await response.json();
    allProducts = data.products || [];
    
    // Calculate pagination
    totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
    currentPage = 1;
    
    renderCurrentPage();
    renderPagination();
  } catch (err) {
    console.error('[DanhMuc] Error loading products:', err);
    const grid = document.querySelector('.prod-list__grid');
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Không thể tải sản phẩm. Vui lòng kiểm tra kết nối API.</p>';
  }
}

// Render current page products
function renderCurrentPage() {
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const productsToShow = allProducts.slice(startIndex, endIndex);
  renderProducts(productsToShow);
}

// Render products to grid
function renderProducts(products) {
  const grid = document.querySelector('.prod-list__grid');
  if (!grid) {
    console.error('[DanhMuc] .prod-list__grid not found in HTML');
    return;
  }
  
  if (!products || products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Không tìm thấy sản phẩm nào</p>';
    return;
  }
  
  grid.innerHTML = products.map(p => `
    <section class="prod-list__item">
      <div class="prod-list__item__image">
        <a href="./sanpham.html?id=${p._id}">
          <img class="prod-list__item__img1" src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" alt="${p.name}" loading="lazy" />
        </a>
        ${p.salePrice ? '<span class="product-sale-tag"><span>SALE!</span></span>' : '<span class="product-sale-tag"><span>NEW!</span></span>'}
        <div class="button-heart-cart-hover">
          <button class="btn-heart" data-id="${p._id}" title="Yêu thích">
            <img src="./icon/heart.svg" alt="Wishlist" />
          </button>
          <button class="btn-cart" data-id="${p._id}" title="Thêm vào giỏ">
            <img src="./icon/cart.svg" alt="Cart" />
          </button>
        </div>
      </div>
      <div class="prod-list__item__inner">
        <div class="prod-list__item__inner--child">
          <div class="prod-list__item__info">
            <div class="prod-list__item__info--title">
              <a href="./sanpham.html?id=${p._id}">${escapeHtml(p.name)}</a>
            </div>
            <div class="prod-list__item__info--masp">${p.category && p.category.name ? escapeHtml(p.category.name) : ''}</div>
          </div>
          <div class="prod-list__item__info--price-fb">
            <div class="prod-list__item--price">
              <span class="prod-list__item__info--price">${formatPrice(p.salePrice || p.price)}</span>
              ${p.salePrice ? `<span class="prod-list__item__info--price-sales">${formatPrice(p.price)}</span>` : ''}
            </div>
            <div class="prod-list__item__info--star-icon">
              <img class="info--star-icon" loading="lazy" alt="" src="./icon/star.svg"/>
              <div class="prod-list__item__info--fb">4.3</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `).join('');
  
  // Add to cart handlers
  grid.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await addToCartHandler(id);
    });
  });
  
  // Wishlist handlers
  grid.querySelectorAll('.btn-heart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await addToWishlistHandler(id);
    });
  });
}

// Setup filter controls
function setupFilters() {
  // Price range filters
  const priceFilters = document.querySelectorAll('input[name="price-filter"]');
  priceFilters.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // Uncheck other price filters
      priceFilters.forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
      });
      applyAllFilters();
    });
  });
  
  // Material filters
  const materialFilters = document.querySelectorAll('.chat-lieu-filter input[type="checkbox"]');
  materialFilters.forEach(checkbox => {
    checkbox.addEventListener('change', () => applyAllFilters());
  });
  
  // Style filters
  const styleFilters = document.querySelectorAll('.kieu-dang-filter input[type="checkbox"]');
  styleFilters.forEach(checkbox => {
    checkbox.addEventListener('change', () => applyAllFilters());
  });
  
  // Sort select
  const sortSelect = document.querySelector('select[name="sort-by"]');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => applyAllFilters());
  }
  
  // Category nav links
  const categoryLinks = document.querySelectorAll('.product-wrap--nav-links a');
  categoryLinks.forEach((link, index) => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      categoryLinks.forEach(l => l.parentElement.classList.remove('active'));
      link.parentElement.classList.add('active');
      
      // Map categories: TẤT CẢ, NHẪN, DÂY CHUYỀN, VÒNG TAY, BÔNG TAI
      const categoryNames = ['', 'Nhẫn', 'Dây chuyền', 'Vòng tay', 'Bông tai'];
      const categoryName = categoryNames[index] || '';
      
      await loadProductsWithFilters({ categoryName });
    });
  });
}

async function applyAllFilters() {
  const filters = {};
  
  // Get price range
  const selectedPrice = document.querySelector('input[name="price-filter"]:checked');
  if (selectedPrice) {
    const priceData = selectedPrice.getAttribute('data-price');
    if (priceData && priceData !== '0:max') {
      const [min, max] = priceData.split(':').map(p => parseInt(p.replace(/,/g, '')));
      if (!isNaN(min)) filters.minPrice = min;
      if (!isNaN(max)) filters.maxPrice = max;
    }
  }
  
  // Get materials
  const selectedMaterials = Array.from(document.querySelectorAll('.chat-lieu-filter input:checked'))
    .map(cb => cb.parentElement.getAttribute('data-filter'))
    .filter(Boolean);
  if (selectedMaterials.length > 0) {
    filters.material = selectedMaterials.join(',');
  }
  
  // Get styles
  const selectedStyles = Array.from(document.querySelectorAll('.kieu-dang-filter input:checked'))
    .map(cb => cb.parentElement.getAttribute('data-filter'))
    .filter(Boolean);
  if (selectedStyles.length > 0) {
    filters.style = selectedStyles.join(',');
  }
  
  // Use current sort
  filters.sort = currentSort;
  
  // Get active category from nav
  const activeCategoryLink = document.querySelector('.product-wrap--nav-links li.active a');
  if (activeCategoryLink) {
    const categoryIndex = Array.from(document.querySelectorAll('.product-wrap--nav-links a')).indexOf(activeCategoryLink);
    const categoryNames = ['', 'Nhẫn', 'Dây chuyền', 'Vòng tay', 'Bông tai'];
    const categoryName = categoryNames[categoryIndex] || '';
    if (categoryName) filters.categoryName = categoryName;
  }
  
  await loadProductsWithFilters(filters);
}

// Apply sort filter (called from HTML dropdown)
window.applySortFilter = async function(sortValue) {
  currentSort = sortValue;
  console.log('Sorting by:', currentSort);
  await applyAllFilters();
};

async function loadProductsWithFilters(filters = {}) {
  try {
    let url = window.api.BASE_URL + '/products?';
    
    if (filters.categoryName) {
      url += `categoryName=${encodeURIComponent(filters.categoryName)}&`;
    }
    if (filters.minPrice) url += `minPrice=${filters.minPrice}&`;
    if (filters.maxPrice) url += `maxPrice=${filters.maxPrice}&`;
    if (filters.material) url += `material=${encodeURIComponent(filters.material)}&`;
    if (filters.style) url += `style=${encodeURIComponent(filters.style)}&`;
    if (filters.sort) url += `sort=${filters.sort}&`;
    
    url += 'limit=50';
    
    console.log('Fetching products with URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    const products = data.products || data.data || [];
    
    renderProducts(products);
  } catch (err) {
    console.error('[DanhMuc] Error loading products with filters:', err);
    const grid = document.querySelector('.prod-list__grid');
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Không thể tải sản phẩm. Vui lòng thử lại.</p>';
  }
}

// Add to cart handler - export to global for swiper buttons
window.addToCartHandler = async function(productId) {
  try {
    console.log('[addToCart] Starting, productId:', productId);
    const token = window.api.getToken && window.api.getToken();
    console.log('[addToCart] Token exists:', !!token);
    
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.location.href = './dangnhap.html';
      return;
    }
    
    console.log('[addToCart] Calling API addToCart...');
    const response = await window.api.addToCart(productId, 1);
    console.log('[addToCart] API response:', response);
    
    if (response && response.success) {
      alert('Đã thêm vào giỏ hàng!');
      window.initHeader && window.initHeader();
    } else {
      console.error('[addToCart] API returned non-success:', response);
      alert('Lỗi: ' + (response.message || 'Không thể thêm vào giỏ hàng'));
    }
  } catch (err) {
    console.error('[addToCart] ERROR:', err);
    alert('Có lỗi xảy ra: ' + err.message);
  }
};

// Add to wishlist handler - export to global for swiper buttons
window.addToWishlistHandler = async function(productId) {
  try {
    const token = window.api.getToken && window.api.getToken();
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      window.location.href = './dangnhap.html';
      return;
    }
    
    const data = await window.api.authFetch('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    
    if (data.success) {
      alert('✅ Đã thêm vào danh sách yêu thích!');
      window.initHeader && window.initHeader();
    } else {
      alert(data.message || 'Không thể thêm vào danh sách yêu thích');
    }
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    alert('❌ Có lỗi xảy ra');
  }
};

// Helper functions
function escapeHtml(text) {
  if (!text) return '';
  const str = typeof text === 'object' ? (text.name || String(text)) : String(text);
  return str.replace(/[&"'<>]/g, (a) => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a]));
}

function formatPrice(n) {
  return (n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

// Render pagination
function renderPagination() {
  const paginationContainer = document.querySelector('.prod-list__pagi');
  if (!paginationContainer) return;
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // First page button
  html += `<button class="pagi-btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
  
  // Previous button
  html += `<button class="pagi-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="pagi-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="pagi-dots">...</span>`;
    }
  }
  
  // Next button
  html += `<button class="pagi-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
  
  // Last page button
  html += `<button class="pagi-btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
  
  paginationContainer.innerHTML = html;
  
  // Add click handlers
  paginationContainer.querySelectorAll('.pagi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'));
      if (page && page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCurrentPage();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ===== BEHAVIOR TRACKING =====
async function trackSearch(query) {
  try {
    if (!window.api.isLoggedIn()) return;
    
    await window.api.authFetch('/behavior/track', {
      method: 'POST',
      body: JSON.stringify({
        action: 'search',
        metadata: { query }
      })
    });
  } catch (err) {
    console.error('Track search error:', err);
  }
}

// Add to existing search functionality
const originalApplyFilters = window.applyFilters;
window.applyFilters = async function() {
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value.trim()) {
    await trackSearch(searchInput.value.trim());
  }
  if (originalApplyFilters) originalApplyFilters();
};