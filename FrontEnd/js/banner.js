// Banner Notification System with Products
console.log('Banner script loaded!');

async function createBanner() {
  console.log('Fetching banner data...');
  
  try {
    // Fetch banner from API (port 5000)
    const response = await fetch('http://localhost:5000/api/banners/active');
    const data = await response.json();
    
    console.log('Banner API response:', data);
    
    if (data.success && data.banners && data.banners.length > 0) {
      const bannerData = data.banners[0];
      console.log('Banner data with products:', bannerData);
      
      // Banner từ database đã có products được populate
      showBanner({
        title: bannerData.title,
        message: bannerData.message,
        type: bannerData.type || 'sale',
        discount: bannerData.discount,
        products: bannerData.productIds || [] // productIds đã được populate thành full product objects
      });
    } else {
      console.log('No active banners found');
      // Không hiển thị gì nếu không có banner
    }
  } catch (error) {
    console.error('Error fetching banner:', error);
    // Không hiển thị gì nếu có lỗi
  }
}

function showBanner(bannerData) {
  console.log('Creating banner element with products...');
  
  const banner = document.createElement('div');
  banner.className = `banner-notification ${bannerData.type || 'sale'} show`;
  
  // Create products HTML
  let productsHTML = '';
  if (bannerData.products && bannerData.products.length > 0) {
    productsHTML = `
      <div class="banner-products">
        ${bannerData.products.map(product => {
          const discount = product.salePrice 
            ? Math.round((1 - product.salePrice / product.price) * 100)
            : bannerData.discount || 0;
          
          return `
            <a href="./sanpham.html?id=${product._id}" class="banner-product-card">
              <div class="banner-product-image">
                <img src="${product.images && product.images[0] ? product.images[0] : './img/placeholder.png'}" 
                     alt="${product.name}" 
                     onerror="this.src='./img/placeholder.png'">
                ${discount > 0 ? `<span class="banner-product-badge">-${discount}%</span>` : ''}
              </div>
              <div class="banner-product-info">
                <h3 class="banner-product-name">${product.name}</h3>
                <div class="banner-product-price">
                  <span class="banner-product-sale-price">${(product.salePrice || product.price).toLocaleString('vi-VN')} VNĐ</span>
                  ${product.salePrice ? `<span class="banner-product-original-price">${product.price.toLocaleString('vi-VN')} VNĐ</span>` : ''}
                </div>
                <button class="banner-product-btn">Xem chi tiết</button>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }
  
  banner.innerHTML = `
    <div class="banner-content">
      <div class="banner-header">
        <span class="banner-icon">${getIcon(bannerData.type)}</span>
        <div class="banner-text">
          <p class="banner-title">${bannerData.title}</p>
          <p class="banner-message">${bannerData.message}</p>
        </div>
        <button class="banner-close" aria-label="Đóng">&times;</button>
      </div>
      ${productsHTML}
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);
  document.body.classList.add('banner-active');
  console.log('Banner added to page!');

  // Close button
  banner.querySelector('.banner-close').addEventListener('click', (e) => {
    e.preventDefault();
    closeBanner(banner);
  });

  // Auto close after 60s if there are products, 30s otherwise
  const autoCloseTime = bannerData.products && bannerData.products.length > 0 ? 60000 : 30000;
  setTimeout(() => {
    if (banner.parentNode) {
      closeBanner(banner);
    }
  }, autoCloseTime);
}

function closeBanner(banner) {
  console.log('Closing banner');
  banner.classList.remove('show');
  document.body.classList.remove('banner-active');
  setTimeout(() => {
    if (banner.parentNode) {
      banner.remove();
    }
  }, 500);
}

function getIcon(type) {
  const icons = {
    sale: '🔥',
    new: '✨',
    flash: '⚡',
    announcement: '📢'
  };
  return icons[type] || '🎁';
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createBanner);
} else {
  createBanner();
}
