function load(selector, path) {
  const cached = localStorage.getItem(path);
  if (cached) {
    document.querySelector(selector).innerHTML = cached;
    setTimeout(()=>{ if (window.initHeader) window.initHeader(); }, 0);
  }

  fetch(path)
    .then((res) => res.text())
    .then((html) => {
      if (html !== cached) {
        document.querySelector(selector).innerHTML = html;
        localStorage.setItem(path, html);
      }
      setTimeout(()=>{ if (window.initHeader) window.initHeader(); }, 0);
    });
}

// Initialize header UI after template is loaded
window.initHeader = function() {
  const userArea = document.getElementById('user-area');
  const cartCountEl = document.getElementById('cart-count');
  const wishlistEl = document.getElementById('wishlist-count');

  function setCartCount(n){ if (cartCountEl) cartCountEl.textContent = n; }
  function setWishlistCount(n){ if (wishlistEl) wishlistEl.textContent = n; }

  // Load wishlist count from database
  (async () => {
    const token = window.api && window.api.getToken ? window.api.getToken() : null;
    if (token && window.api && window.api.authFetch) {
      try {
        const data = await window.api.authFetch('/wishlist');
        const wishlist = data.data || data;
        const count = wishlist.products ? wishlist.products.length : 0;
        setWishlistCount(count);
      } catch (err) {
        console.warn('Cannot load wishlist count', err);
        setWishlistCount(0);
      }
    } else {
      setWishlistCount(0);
    }
  })();

  // Render user area từ authSync
  const profile = window.authSync ? window.authSync.getCurrentUser() : null;
  const token = window.api && window.api.getToken ? window.api.getToken() : localStorage.getItem('accessToken');

  if (profile && token) {
    try {
      if (userArea) {
        const displayName = profile.username || profile.email || 'Người dùng';
        const shortName = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;
        
        // Create unique ID for this dropdown
        const dropdownId = 'user-dropdown-' + Date.now();
        
        userArea.innerHTML = `
          <img src="./icon/user.svg" alt="User" id="user-icon-toggle" style="width:22px;height:22px;cursor:pointer;"/>
          <div class="user-dropdown" id="${dropdownId}">
            <div style="padding:12px 20px;border-bottom:1px solid rgba(239,144,89,0.15);margin-bottom:8px;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--index-primary-color);margin-bottom:4px;">${shortName}</div>
              <div style="font-size:1.2rem;color:var(--index-text-color-1);">${profile.email || ''}</div>
            </div>
            <a href="./thongtincanhan.html" class="dropdown-link">
              <span style="font-size:18px;">👤</span>
              Thông tin cá nhân
            </a>
            <a href="./donhang.html" class="dropdown-link">
              <span style="font-size:18px;">📦</span>
              Đơn hàng
            </a>
            ${profile.role === 'admin' ? `
            <a href="./admin.html" class="dropdown-link">
              <span style="font-size:18px;">⚙️</span>
              Quản trị
            </a>
            ` : ''}
            <div style="height:1px;background:rgba(239,144,89,0.15);margin:8px 0;"></div>
            <a href="#" id="btn-logout-${dropdownId}" class="dropdown-link">
              <span style="font-size:18px;">🚪</span>
              Đăng xuất
            </a>
          </div>
        `;
        
        // Direct event binding with proper timing
        requestAnimationFrame(() => {
          const iconToggle = document.getElementById('user-icon-toggle');
          const dropdown = document.getElementById(dropdownId);
          const btnLogout = document.getElementById('btn-logout-' + dropdownId);
          
          console.log('Elements:', { iconToggle, dropdown, btnLogout });
          
          if (iconToggle && dropdown) {
            console.log('✓ Binding click event to icon');
            
            // Direct onclick
            iconToggle.onclick = function(e) {
              console.log('✓ Icon clicked!');
              e.stopPropagation();
              const isVisible = dropdown.classList.contains('show');
              if (isVisible) {
                dropdown.classList.remove('show');
                console.log('Closing dropdown');
              } else {
                dropdown.classList.add('show');
                console.log('Opening dropdown');
              }
            };
            
            // Close on outside click
            document.addEventListener('click', function(e) {
              if (!userArea.contains(e.target)) {
                dropdown.classList.remove('show');
              }
            });
            
            // Logout handler
            if (btnLogout) {
              btnLogout.onclick = function(e) {
                e.preventDefault();
                if (window.api && window.api.logout) {
                  window.api.logout();
                }
                window.location.href = './index.html';
              };
            }
            
            console.log('✓ User dropdown ready');
          } else {
            console.error('✗ Elements not found:', { iconToggle, dropdown });
          }
        });
      }
    } catch (err) {
      console.error('✗ Error rendering user area:', err);
      if (userArea) userArea.innerHTML = `<a href='./dangky.html'><img src='./icon/user.svg' alt=''/></a>`;
    }
  } else {
    if (userArea) userArea.innerHTML = `<a href='./dangky.html'><img src='./icon/user.svg' alt=''/></a>`;
  }

  // Update cart count (server if logged in, local otherwise)
  (async () => {
    if (token && window.api && window.api.getCart) {
      try {
        const cart = await window.api.getCart();
        const count = cart && cart.items ? cart.items.reduce((s,i)=>s+(i.quantity||i.qty||0),0) : 0;
        setCartCount(count);
      } catch (err) {
        console.warn('Không lấy được giỏ hàng server', err);
        const localCount = (window.api && window.api.getLocalCart ? window.api.getLocalCart().reduce((s,i)=>s+i.qty,0) : 0);
        setCartCount(localCount);
      }
    } else {
      const localCount = (window.api && window.api.getLocalCart ? window.api.getLocalCart().reduce((s,i)=>s+i.qty,0) : 0);
      setCartCount(localCount);
    }
  })();

  // Lắng nghe thay đổi auth từ các tab khác hoặc thay đổi cục bộ
  if (window.authSync) {
    window.authSync.on('onChange', () => {
      // Cập nhật lại header khi có thay đổi
      setTimeout(() => window.initHeader(), 100);
    });
  }
};

function search() {
  const searchBox = document.querySelector(".search-box");
  if (searchBox) searchBox.classList.add("active");
}

function closeSearch() {
  const searchBoxActive = document.querySelector(".search-box.active");
  if (searchBoxActive) searchBoxActive.classList.remove("active");
}

// Click SẢN PHẨM
function megaFunction() {
  const megamenu = document.querySelector(".mega-menu");
  if (megamenu) megamenu.classList.toggle("active");
}

// Hamburger menu
function burgerFunction() {
  const overlay = document.querySelector(".menu-overlay");
  const menuDrawer = document.querySelector(".menu-drawer");
  if (overlay) overlay.classList.toggle("active");
  if (menuDrawer) menuDrawer.classList.toggle("active");
}

// Dark mode
function darkFunction() {
  document.body.classList.toggle("dark-mode");
    // Save to localStorage
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem('darkMode', isDark);
    console.log(`🌓 Dark mode: ${isDark ? 'ON' : 'OFF'}`);  }