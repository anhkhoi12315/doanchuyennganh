(function(){
  const API_BASE = 'http://localhost:5000/api';

  function getToken() {
    return localStorage.getItem('accessToken');
  }

  function setToken(token) {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }

  function notifyAuthChange() {
    if (window.authSync) {
      const user = window.authSync.getCurrentUser();
      if (user) {
        window.authSync.updateProfile(user);
      }
    }
  }

  async function authFetch(path, options = {}) {
    options.headers = options.headers || {};
    if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, options);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    
    return res.json();
  }

  async function login(username, password) {
    console.log('[api] login called:', username);
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    console.log('[api] response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('[api] response data:', data);
    
    // Lưu dữ liệu và thông báo cho authSync
    if (data.accessToken && data.profile) {
      console.log('[api] saving token and profile');
      setToken(data.accessToken);
      if (window.authSync) {
        window.authSync.setAuthData(data.profile, data.accessToken, data.refreshToken);
      }
    }
    
    return data;
  }

  async function getProducts() {
    const res = await fetch(API_BASE + '/products');
    return res.json();
  }

  async function getProduct(id) {
    const res = await fetch(API_BASE + '/products/' + id);
    return res.json();
  }

  async function getCart() {
    const data = await authFetch('/cart');
    return data && data.data ? data.data : data;
  }

  async function addToCart(productId, qty = 1) {
    const data = await authFetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: qty })
    });
    return data;
  }

  async function mergeCart(items) {
    // items: [{ productId, qty }]
    const data = await authFetch('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    return data;
  }

  function getLocalCart() {
    try {
      const raw = localStorage.getItem('cart');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) { return []; }
  }

  function setLocalCart(items) {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  function clearLocalCart() {
    localStorage.removeItem('cart');
  }

  function addToLocalCart(productId, qty = 1) {
    const items = getLocalCart();
    const existing = items.find(i => i.productId === productId);
    if (existing) existing.qty = (existing.qty || 0) + qty;
    else items.push({ productId, qty });
    setLocalCart(items);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('profile');
    if (window.authSync) {
      window.authSync.clearAuthData();
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  window.api = {
    BASE_URL: API_BASE,
    login, getProducts, getProduct, getCart, addToCart, mergeCart,
    getLocalCart, setLocalCart, clearLocalCart, addToLocalCart, getToken, setToken, authFetch, logout, isLoggedIn
  };
})();
