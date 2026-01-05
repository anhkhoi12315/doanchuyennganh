// admin.js - Quản lý Products và Categories

// ===== IMAGE MANAGER =====
let productImages = [];

function renderImagesPreview() {
  const previewContainer = document.getElementById('images-preview');
  const hiddenInput = document.getElementById('p-images');
  
  if (!previewContainer) return;
  
  if (productImages.length === 0) {
    previewContainer.innerHTML = '<div style="text-align:center;color:#999;padding:20px;grid-column:1/-1;">Chưa có ảnh nào. Nhập URL và nhấn "Thêm"</div>';
  } else {
    previewContainer.innerHTML = productImages.map((url, index) => `
      <div style="position:relative;border:2px solid #ddd;border-radius:8px;overflow:hidden;background:white;">
        <img src="${url}" alt="Image ${index + 1}" style="width:100%;height:120px;object-fit:cover;" onerror="this.src='./img/placeholder.png';" />
        <button type="button" onclick="removeImage(${index})" style="position:absolute;top:5px;right:5px;background:#e74c3c;color:white;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,0.3);">×</button>
        <div style="font-size:11px;color:#666;padding:5px;text-align:center;background:#f5f5f5;">Ảnh ${index + 1}</div>
      </div>
    `).join('');
  }
  
  // Update hidden input
  hiddenInput.value = productImages.join(',');
}

function addImage() {
  const input = document.getElementById('new-image-url');
  const url = input.value.trim();
  
  if (!url) {
    alert('⚠️ Vui lòng nhập URL ảnh');
    return;
  }
  
  productImages.push(url);
  renderImagesPreview();
  input.value = '';
  input.focus();
}

function removeImage(index) {
  if (confirm('Xóa ảnh này?')) {
    productImages.splice(index, 1);
    renderImagesPreview();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('admin-status');

  // Kiểm tra quyền admin
  if (!window.roleCheck || !window.roleCheck.checkAdminPageAccess('admin-status')) {
    return;
  }
  
  // Setup image manager
  const addImageBtn = document.getElementById('add-image-btn');
  const newImageInput = document.getElementById('new-image-url');
  
  if (addImageBtn) {
    addImageBtn.addEventListener('click', addImage);
  }
  
  if (newImageInput) {
    newImageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addImage();
      }
    });
  }
  
  // Initialize empty preview
  renderImagesPreview();

  // ==================== PRODUCTS ====================
  const productsTableBody = document.querySelector('#products-tbody');
  const productForm = document.getElementById('product-form');
  const productSearchInput = document.getElementById('product-search');
  
  // Fetch và render products từ API
  async function fetchProducts(query = '') {
    try {
      let url = window.api.BASE_URL + '/products?limit=100';
      if (query) url += `&search=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data.products || [];
    } catch (err) {
      console.error('Lỗi fetch products:', err);
      return [];
    }
  }

  async function renderProducts(query = '') {
    productsTableBody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';
    const products = await fetchProducts(query);
    
    console.log('Rendering products:', products.length);
    if (products.length > 0) {
      console.log('First product images:', products[0].images);
    }
    
    if (!products.length) {
      productsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</td></tr>';
      return;
    }

    productsTableBody.innerHTML = products.map(p => {
      const categoryName = p.category?.name || p.category || 'N/A';
      return `
        <tr>
          <td><img src="${p.images && p.images[0] ? p.images[0] : './img/placeholder.png'}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" /></td>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span class="category-badge">${escapeHtml(categoryName)}</span></td>
          <td>${p.salePrice ? `<span style="color:#e74c3c;font-weight:bold;">${(p.salePrice||0).toLocaleString('vi-VN')} VNĐ</span><br><span style="text-decoration:line-through;color:#999;font-size:12px;">${(p.price||0).toLocaleString('vi-VN')} VNĐ</span>` : `${(p.price||0).toLocaleString('vi-VN')} VNĐ`}</td>
          <td>${p.stock||0}</td>
          <td>${p.sold||0}</td>
          <td>
            <button class="btn edit-product" data-id="${p._id}">✏️ Sửa</button>
            <button class="btn secondary delete-product" data-id="${p._id}">🗑️ Xóa</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind events
    productsTableBody.querySelectorAll('.edit-product').forEach(btn => {
      btn.addEventListener('click', () => fillProductForm(products.find(x => x._id === btn.dataset.id)));
    });

    productsTableBody.querySelectorAll('.delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
          await window.api.authFetch('/products/' + btn.dataset.id, { method: 'DELETE' });
          alert('✅ Đã xóa sản phẩm');
          await renderProducts(productSearchInput.value);
        } catch (err) {
          alert('❌ Lỗi: ' + (err.message||err));
        }
      });
    });
  }

  function fillProductForm(p) {
    document.getElementById('p-id').value = p._id;
    document.getElementById('p-name').value = p.name || '';
    document.getElementById('p-price').value = p.price || 0;
    document.getElementById('p-salePrice').value = p.salePrice || '';
    document.getElementById('p-category').value = p.category?._id || p.category || '';
    
    // Load images into image manager
    productImages = p.images || [];
    renderImagesPreview();
    
    document.getElementById('p-stock').value = p.stock || 0;
    document.getElementById('p-material').value = p.material || '';
    document.getElementById('p-style').value = p.style || '';
    document.getElementById('p-weight').value = p.weight || '';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('product-form-title').textContent = '✏️ Sửa sản phẩm';
  }

  // Product form submit
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    
    const price = parseFloat(document.getElementById('p-price').value) || 0;
    const salePrice = parseFloat(document.getElementById('p-salePrice').value) || null;
    
    console.log('Submitting with images:', productImages);
    console.log('Images count:', productImages.length);
    
    const payload = {
      name: document.getElementById('p-name').value.trim(),
      price: price,
      salePrice: salePrice,
      category: document.getElementById('p-category').value.trim(),
      images: productImages,
      stock: parseInt(document.getElementById('p-stock').value) || 0,
      material: document.getElementById('p-material').value.trim(),
      style: document.getElementById('p-style').value.trim(),
      weight: parseFloat(document.getElementById('p-weight').value) || null,
      description: document.getElementById('p-desc').value.trim()
    };

    try {
      if (!id) {
        const data = await window.api.authFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
        alert('✅ Thêm sản phẩm thành công!');
      } else {
        const data = await window.api.authFetch('/products/' + id, { method: 'PUT', body: JSON.stringify(payload) });
        alert('✅ Cập nhật sản phẩm thành công!');
      }
      productForm.reset();
      document.getElementById('p-id').value='';
      document.getElementById('product-form-title').textContent='Thêm sản phẩm';
      productImages = [];
      renderImagesPreview();
      await renderProducts(productSearchInput.value);
      await loadCategoriesForSelect(); // Reload category dropdown
    } catch (err) {
      alert('❌ Lỗi: ' + (err.message||err));
    }
  });

  // Product reset form
  document.getElementById('reset-product-form').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('p-id').value = '';
    document.getElementById('product-form-title').textContent = 'Thêm sản phẩm';
    productImages = [];
    renderImagesPreview();
  });

  // Product search
  productSearchInput.addEventListener('input', () => renderProducts(productSearchInput.value));
  document.getElementById('refresh-products-btn').addEventListener('click', () => renderProducts(productSearchInput.value));

  // ==================== CATEGORIES ====================
  const categoriesTableBody = document.querySelector('#categories-tbody');
  const categoryForm = document.getElementById('category-form');
  const categorySearchInput = document.getElementById('category-search');

  // Fetch và render categories
  async function fetchCategories(query = '') {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const list = await res.json();
      if (!Array.isArray(list)) return [];
      return query ? list.filter(c => (c.name||'').toLowerCase().includes(query.toLowerCase())) : list;
    } catch (err) {
      console.error('Lỗi fetch categories:', err);
      return [];
    }
  }

  async function renderCategories(query = '') {
    categoriesTableBody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    const categories = await fetchCategories(query);
    
    if (!categories.length) {
      categoriesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">Chưa có danh mục nào. Hãy thêm danh mục mới!</td></tr>';
      return;
    }

    // Get product count for each category
    const productCounts = {};
    try {
      const response = await fetch(window.api.BASE_URL + '/products?limit=1000');
      const data = await response.json();
      const products = data.products || [];
      
      products.forEach(p => {
        const catId = p.category?._id || p.category;
        if (catId) {
          productCounts[catId] = (productCounts[catId] || 0) + 1;
        }
      });
    } catch (err) {
      console.error('Error counting products:', err);
    }

    categoriesTableBody.innerHTML = categories.map(c => {
      const productCount = productCounts[c._id] || 0;
      return `
        <tr>
          <td><img src="${c.image || './img/placeholder.png'}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" /></td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.description || 'N/A')}</td>
          <td><span class="category-badge">${productCount} sản phẩm</span></td>
          <td>
            <button class="btn edit-category" data-id="${c._id}">✏️ Sửa</button>
            <button class="btn secondary delete-category" data-id="${c._id}">🗑️ Xóa</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind events
    categoriesTableBody.querySelectorAll('.edit-category').forEach(btn => {
      btn.addEventListener('click', () => fillCategoryForm(categories.find(x => x._id === btn.dataset.id)));
    });

    categoriesTableBody.querySelectorAll('.delete-category').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
        try {
          await window.api.authFetch('/categories/' + btn.dataset.id, { method: 'DELETE' });
          alert('✅ Đã xóa danh mục');
          await renderCategories(categorySearchInput.value);
          await loadCategoriesForSelect(); // Reload dropdown
        } catch (err) {
          alert('❌ Lỗi: ' + (err.message||err));
        }
      });
    });
  }

  function fillCategoryForm(c) {
    document.getElementById('c-id').value = c._id;
    document.getElementById('c-name').value = c.name || '';
    document.getElementById('c-description').value = c.description || '';
    document.getElementById('c-image').value = c.image || '';
    document.getElementById('category-form-title').textContent = '✏️ Sửa danh mục';
  }

  // Category form submit
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('c-id').value;
    const payload = {
      name: document.getElementById('c-name').value.trim(),
      description: document.getElementById('c-description').value.trim(),
      image: document.getElementById('c-image').value.trim()
    };

    try {
      if (!id) {
        const res = await window.api.authFetch('/categories', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Không thể tạo danh mục');
        alert('✅ Thêm danh mục thành công!');
      } else {
        const res = await window.api.authFetch('/categories/' + id, { method: 'PUT', body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Không thể cập nhật');
        alert('✅ Cập nhật danh mục thành công!');
      }
      categoryForm.reset();
      document.getElementById('c-id').value='';
      document.getElementById('category-form-title').textContent='Thêm danh mục';
      await renderCategories(categorySearchInput.value);
      await loadCategoriesForSelect(); // Reload dropdown in products
    } catch (err) {
      alert('❌ Lỗi: ' + (err.message||err));
    }
  });

  // Category reset form
  document.getElementById('reset-category-form').addEventListener('click', () => {
    categoryForm.reset();
    document.getElementById('c-id').value = '';
    document.getElementById('category-form-title').textContent = 'Thêm danh mục';
  });

  // Category search
  categorySearchInput.addEventListener('input', () => renderCategories(categorySearchInput.value));
  document.getElementById('refresh-categories-btn').addEventListener('click', () => renderCategories(categorySearchInput.value));

  // Load categories for product dropdown (use _id not name)
  async function loadCategoriesForSelect() {
    const categories = await fetchCategories();
    const select = document.getElementById('p-category');
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Chọn danh mục --</option>' + 
      categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
    if (currentValue) select.value = currentValue;
  }

  // Export functions for socketClient
  window.renderProducts = renderProducts;
  window.renderCategories = renderCategories;

  // Initial load
  await Promise.all([
    renderProducts(),
    renderCategories(),
    loadCategoriesForSelect()
  ]);

  // Helper function
  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&"'<>]/g, a => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'})[a]);
  }
});
