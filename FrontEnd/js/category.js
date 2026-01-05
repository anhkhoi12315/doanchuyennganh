document.addEventListener('DOMContentLoaded', async () => {
  if (!window.api || !window.api.getProducts) return;
  const grid = document.querySelector('.prod-list__grid');
  const toolbarCount = document.querySelector('#toolbar-amount .toolbar-number') || document.querySelector('.toolbar-number');
  const paginationContainer = document.querySelector('.prod-list__pagination .prod-list__pagination--numbers');
  const PAGE_SIZE = 12;

  function getWishlist(){ try { const raw = localStorage.getItem('wishlist'); return raw ? JSON.parse(raw) : []; } catch(e){ return []; } }
  function setWishlist(arr){ localStorage.setItem('wishlist', JSON.stringify(arr)); }

  const products = await window.api.getProducts();
  let filtered = products.slice();

  function renderPage(page = 1){
    const start = (page-1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    if (toolbarCount) toolbarCount.textContent = filtered.length;

    grid.innerHTML = pageItems.map(p => `
      <section class="prod-list__item" data-id="${p._id}">
        <div class="prod-list__item__image">
          <a href="./sanpham.html?id=${p._id}"><img class="prod-list__item__img1" loading="lazy" alt="" src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}"/></a>
          ${p.stock && p.stock>0 ? '<span class="product-sale-tag"><span> NEW!</span></span>' : ''}
          <div class="button-heart-cart-hover">
            <button class="btn-heart" data-id="${p._id}" aria-label="Yêu thích"><img src="./icon/heart.svg"/></button>
            <button class="btn-cart" data-id="${p._id}" aria-label="Thêm vào giỏ"><img src="./icon/cart.svg"/></button>
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
      </section>`).join('');

    // wire buttons
    grid.querySelectorAll('.btn-heart').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const wl = getWishlist();
      if (wl.includes(id)) btn.classList.add('active');
      btn.addEventListener('click', () => {
        let wl = getWishlist();
        if (wl.includes(id)) wl = wl.filter(x => x !== id);
        else wl.push(id);
        setWishlist(wl);
        btn.classList.toggle('active');
        window.initHeader && window.initHeader();
      });
    });

    grid.querySelectorAll('.btn-cart').forEach(btn => {
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', async () => {
        const token = window.api.getToken && window.api.getToken();
        if (token) {
          await window.api.addToCart(id, 1);
          alert('Đã thêm vào giỏ hàng');
        } else {
          window.api.addToLocalCart && window.api.addToLocalCart(id, 1);
          alert('Bạn chưa đăng nhập — sản phẩm được lưu tạm vào giỏ hàng');
        }
        window.initHeader && window.initHeader();
      });
    });

    renderPagination(Math.ceil(filtered.length / PAGE_SIZE), page);
  }

  function renderPagination(totalPages, current){
    if (!paginationContainer) return;
    let html = '';
    for (let i=1;i<=totalPages;i++){
      html += `<a href="#" class="link ${i===current? 'active':''}" data-page="${i}">${i}</a>`;
    }
    paginationContainer.innerHTML = html;
    paginationContainer.querySelectorAll('.link').forEach(a => {
      a.addEventListener('click', (e)=>{ e.preventDefault(); const p = parseInt(a.getAttribute('data-page')); renderPage(p); window.scrollTo({top: 300, behavior:'smooth'}); });
    });
  }

  // Basic filter hooks (price and category checkboxes)
  document.querySelectorAll('.custom-filter-input input').forEach(checkbox => {
    checkbox.addEventListener('change', () => applyFilters());
  });

  function applyFilters(){
    const priceChecks = Array.from(document.querySelectorAll('input[name="price-filter"]:checked')).map(i=>i.getAttribute('data-price'));
    const categories = Array.from(document.querySelectorAll('.filter-color input:checked')).map(i=>i.closest('label').getAttribute('data-filter'));

    filtered = products.filter(p => {
      let okPrice = true;
      if (priceChecks.length) {
        okPrice = priceChecks.some(pr => {
          const [minStr, maxStr] = pr.split(':');
          const min = parseFloat(minStr.replace(/,/g,''));
          const max = maxStr === 'max' ? Infinity : parseFloat(maxStr.replace(/,/g,''));
          return p.price >= min && p.price <= max;
        });
      }
      let okCat = true;
      if (categories.length) {
        okCat = categories.includes((p.category||'').toString());
      }
      return okPrice && okCat;
    });
    renderPage(1);
  }

  function escapeHtml(text) { if (!text) return ''; return text.replace(/[&"'<>]/g, function(a){return {'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[a];}); }
  function formatPrice(n){ return (n||0).toLocaleString('vi-VN') + ' VNĐ'; }

  // initial render
  renderPage(1);
});
