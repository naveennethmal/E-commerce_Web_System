// App main controller
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Auth Guard: Redirect unauthenticated visitors to login.html
  const loggedInUser = localStorage.getItem('food_express_user');
  const urlParams = new URLSearchParams(window.location.search);
  const isPaymentReturn = urlParams.get('payment') === 'success' && urlParams.get('order_id');

  if (!loggedInUser && !isPaymentReturn) {
    window.location.href = 'login.html';
    return;
  }

  // Handle PayHere payment return callback before rendering
  await checkPaymentSuccessCallback();

  // Initialize cart rendering
  cartManager.render();

  // Initial render with current dataset
  renderCategories();
  renderFeaturedFoods();
  renderMenuPage();
  renderOffersPage();
  renderAboutPage();
  renderCartPage();

  // Attach event listeners
  setupSearchHandler();
  setupModalHandlers();

  // Sync live MySQL Database
  if (typeof syncWithMySQLDatabase === 'function') {
    const synced = await syncWithMySQLDatabase();
    if (synced) {
      renderCategories();
      renderFeaturedFoods();
      renderMenuPage();
      renderOffersPage();
    }
    updateDatabaseStatusBadge();
  }

  // Update user profile status from storage
  updateUserProfileUI();

  // Initialize Header Notification System
  if (window.NotificationSystem) {
    window.NotificationSystem.init();
  }
});

function updateDatabaseStatusBadge() {
  const badge = document.getElementById('db-status-badge');
  if (!badge) return;
  if (window.isDatabaseConnected) {
    badge.className = 'db-status-badge connected';
    badge.innerHTML = '<span class="status-dot green"></span> MySQL: food_express (Connected)';
    badge.title = 'Connected to MySQL server - food_express DB active';
  } else {
    badge.className = 'db-status-badge offline';
    badge.innerHTML = '<span class="status-dot orange"></span> Database Offline (Static Mode)';
    badge.title = 'Using local catalog fallback';
  }
}


// Helper to get storage key unique to logged-in user
function getWishlistStorageKey() {
  try {
    const userJson = localStorage.getItem('food_express_user');
    if (userJson) {
      const u = JSON.parse(userJson);
      if (u && (u.id || u.email)) {
        const identifier = (u.id || u.email).replace(/[^a-zA-Z0-9_-]/g, '_');
        return `food_express_wishlist_${identifier}`;
      }
    }
  } catch (e) {}
  return 'food_express_wishlist_guest';
}

function getSavedWishlist() {
  const key = getWishlistStorageKey();
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {}
  return new Set();
}

let wishlist = getSavedWishlist();

function saveWishlist() {
  try {
    const key = getWishlistStorageKey();
    localStorage.setItem(key, JSON.stringify(Array.from(wishlist)));
  } catch (e) {}
}

function syncWishlistForCurrentUser() {
  wishlist = getSavedWishlist();
  const heartBtns = document.querySelectorAll('.wishlist-heart-btn, .pdetail-wishlist-heart');
  heartBtns.forEach(btn => {
    const foodId = btn.getAttribute('data-food-id') || btn.closest('[data-food-id]')?.getAttribute('data-food-id');
    if (foodId) {
      const isFav = wishlist.has(foodId);
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? '<i class="fa-solid fa-heart" style="color:#EF4444;"></i>' : '<i class="fa-regular fa-heart"></i>';
    }
  });
}

let selectedCategory = 'all';
let searchQuery = '';
let activeMenuFoodId = null;

function toggleWishlist(foodId, btnEl) {
  if (wishlist.has(foodId)) {
    wishlist.delete(foodId);
    if (window.cartManager) {
      cartManager.showToast('Removed from favorites 💔');
    }
  } else {
    wishlist.add(foodId);
    if (window.cartManager) {
      cartManager.showToast('Added to favorites! <i class="fa-solid fa-heart" style="color:#EF4444;"></i>');
    }
  }
  saveWishlist();

  // Update UI heart icons across page
  const isFav = wishlist.has(foodId);
  const heartBtns = document.querySelectorAll(`[data-food-id="${foodId}"] .wishlist-heart-btn, button[onclick*="${foodId}"][class*="heart"]`);
  heartBtns.forEach(btn => {
    btn.classList.toggle('active', isFav);
    btn.innerHTML = isFav ? '<i class="fa-solid fa-heart" style="color:#EF4444;"></i>' : '<i class="fa-regular fa-heart"></i>';
  });

  if (btnEl) {
    btnEl.classList.toggle('active', isFav);
    btnEl.innerHTML = isFav ? '<i class="fa-solid fa-heart" style="color:#EF4444;"></i>' : '<i class="fa-regular fa-heart"></i>';
  }
}

function renderCategories() {
  const containers = [
    document.getElementById('home-categories-list'),
    document.getElementById('menu-categories-list')
  ];

  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = FOOD_CATEGORIES.map(cat => `
      <button class="category-card ${cat.id === selectedCategory ? 'active' : ''}" onclick="filterByCategory('${cat.id}')">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${cat.name}</span>
      </button>
    `).join('');
  });
}

function filterByCategory(catId) {
  selectedCategory = catId;
  activeMenuFoodId = null;
  renderCategories();
  renderFeaturedFoods();
  renderMenuPage();
}

function openMenuFoodDetail(foodId) {
  activeMenuFoodId = foodId;
  if (typeof router !== 'undefined') {
    router.navigateTo('menu');
  }
  renderMenuPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeMenuFoodDetail() {
  activeMenuFoodId = null;
  renderMenuPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchPdetailMainImage(imgUrl, thumbEl) {
  const mainImg = document.getElementById('pdetail-main-img');
  if (mainImg) {
    mainImg.src = imgUrl;
  }
  const thumbs = document.querySelectorAll('.pdetail-thumb-item');
  thumbs.forEach(t => t.classList.remove('active'));
  if (thumbEl) {
    thumbEl.classList.add('active');
  }
}

function adjustPdetailQty(delta) {
  const qtyEl = document.getElementById('pdetail-qty-val');
  if (!qtyEl) return;
  let currentVal = parseInt(qtyEl.textContent, 10) || 1;
  currentVal = Math.max(1, currentVal + delta);
  qtyEl.textContent = currentVal;
}

function addPdetailToCart(foodId) {
  const qtyEl = document.getElementById('pdetail-qty-val');
  const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
  cartManager.addItem(foodId, qty);
}

function buyNowPdetail(foodId) {
  const qtyEl = document.getElementById('pdetail-qty-val');
  const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
  cartManager.addItem(foodId, qty);
  router.navigateTo('checkout');
}

function renderFoodCard(food, showQtyControls = true, isMenuPage = false) {
  const isFav = wishlist.has(food.id);
  const cartItem = cartManager.cart.find(c => c.id === food.id);
  const qtyInCart = cartItem ? cartItem.quantity : 1;

  return `
    <div class="food-card ${isMenuPage ? 'menu-food-card' : ''}" data-category="${food.category}">
      <div class="food-card-img-wrap" onclick="openMenuFoodDetail('${food.id}')" style="cursor: pointer;" title="Click to view details">
        <img src="${food.image}" alt="${food.name}" class="food-card-img" />
        <button class="wishlist-heart-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${food.id}', this)" title="Favorite">
          ${isFav ? '<i class="fa-solid fa-heart" style="color:#EF4444;"></i>' : '<i class="fa-regular fa-heart"></i>'}
        </button>
      </div>
      <div class="food-card-body">
        <h3 class="food-card-title" onclick="openMenuFoodDetail('${food.id}')" style="cursor: pointer;" title="Click to view details">${food.name}</h3>
        <p class="food-card-desc">${food.description}</p>
        <div class="food-card-rating">
          <span class="star-icon"><i class="fa-solid fa-star"></i></span>
          <span class="rating-num">${food.rating}</span>
          <span class="reviews-count">(${food.reviewsCount})</span>
          <span class="food-card-price">Rs. ${food.price.toFixed(2)}</span>
        </div>
        
        <div class="food-card-action-row">
          ${showQtyControls ? `
            <div class="inline-qty-picker" id="qty-picker-${food.id}">
              <button class="qty-picker-btn" onclick="adjustInlineQty('${food.id}', -1)">-</button>
              <span class="qty-picker-val" id="qty-val-${food.id}">${qtyInCart}</span>
              <button class="qty-picker-btn" onclick="adjustInlineQty('${food.id}', 1)">+</button>
            </div>
          ` : ''}
          <button class="btn-add-to-cart" onclick="addInlineQtyToCart('${food.id}')">
            <i class="fa-solid fa-cart-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function adjustInlineQty(foodId, delta) {
  const valEl = document.getElementById(`qty-val-${foodId}`);
  if (!valEl) return;
  let currentVal = parseInt(valEl.textContent, 10) || 1;
  currentVal = Math.max(1, currentVal + delta);
  valEl.textContent = currentVal;
}

function addInlineQtyToCart(foodId) {
  const valEl = document.getElementById(`qty-val-${foodId}`);
  const qty = valEl ? parseInt(valEl.textContent, 10) : 1;
  cartManager.addItem(foodId, qty);
}

function renderFeaturedFoods() {
  const grid = document.getElementById('featured-foods-grid');
  if (!grid) return;

  let foods = FOOD_ITEMS.filter(f => f.isFeatured);

  if (selectedCategory !== 'all') {
    foods = foods.filter(f => f.category === selectedCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    foods = foods.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }

  if (foods.length === 0) {
    grid.innerHTML = `<div class="no-results">No delicious items match your search.</div>`;
    return;
  }

  grid.innerHTML = foods.map(food => renderFoodCard(food, true, false)).join('');
}

function renderMenuFoodDetail(food) {
  const isFav = wishlist.has(food.id);
  const gallery = typeof getFoodGallery === 'function' ? getFoodGallery(food) : [food.image, food.image, food.image, food.image];
  const spicyLevel = typeof getFoodSpicyLevel === 'function' ? getFoodSpicyLevel(food) : 2;

  let spicyChiliesHtml = '';
  for (let i = 1; i <= 4; i++) {
    if (i <= spicyLevel) {
      spicyChiliesHtml += `<span class="chili-icon active" title="Spicy level ${spicyLevel}/4"><i class="fa-solid fa-pepper-hot"></i></span>`;
    } else {
      spicyChiliesHtml += `<span class="chili-icon inactive" title="Spicy level ${spicyLevel}/4"><i class="fa-solid fa-pepper-hot"></i></span>`;
    }
  }

  return `
    <div class="pdetail-container">
      <!-- Top Breadcrumb Bar -->
      <div class="pdetail-breadcrumb">
        <a href="#home" class="pdetail-bc-link" onclick="router.navigateTo('home')">Home</a>
        <span class="pdetail-bc-sep">&gt;</span>
        <button class="pdetail-bc-btn" onclick="closeMenuFoodDetail()">Menu</button>
        <span class="pdetail-bc-sep">&gt;</span>
        <span class="pdetail-bc-current">${food.name}</span>
      </div>

      <!-- Main Layout Grid -->
      <div class="pdetail-layout">
        <!-- Left Gallery Column -->
        <div class="pdetail-gallery-col">
          <div class="pdetail-main-img-box">
            <img id="pdetail-main-img" src="${food.image}" alt="${food.name}" class="pdetail-main-img" />
            <button class="pdetail-wishlist-heart ${isFav ? 'active' : ''}" onclick="toggleWishlist('${food.id}', this)" title="Favorite">
              ${isFav ? '<i class="fa-solid fa-heart" style="color:#EF4444;"></i>' : '<i class="fa-regular fa-heart"></i>'}
            </button>
          </div>
        </div>

        <!-- Right Info Column -->
        <div class="pdetail-info-col">
          <h1 class="pdetail-title">${food.name}</h1>
          <div class="pdetail-price-row">
            <span class="pdetail-price">Rs. ${food.price.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
            ${food.originalPrice ? `<span class="pdetail-old-price">Rs. ${food.originalPrice.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>` : ''}
          </div>
          <div class="pdetail-rating-row">
            <div class="pdetail-stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
            <span class="pdetail-reviews">(${food.reviewsCount} reviews)</span>
          </div>
          <p class="pdetail-desc">
            Short description about the food. ${food.description}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <div class="pdetail-spicy-row">
            <span class="pdetail-spicy-label">Spicy Level:</span>
            <div class="pdetail-chilies">${spicyChiliesHtml}</div>
          </div>
          <div class="pdetail-qty-row">
            <span class="pdetail-qty-label">Quantity:</span>
            <div class="pdetail-qty-picker">
              <button class="pdetail-qty-btn" onclick="adjustPdetailQty(-1)">-</button>
              <span class="pdetail-qty-val" id="pdetail-qty-val">1</span>
              <button class="pdetail-qty-btn" onclick="adjustPdetailQty(1)">+</button>
            </div>
          </div>
          <div class="pdetail-actions">
            <button class="btn-pdetail-add" onclick="addPdetailToCart('${food.id}')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Add to Cart
            </button>
            <button class="btn-pdetail-buynow" onclick="buyNowPdetail('${food.id}')">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMenuPage() {
  const grid = document.getElementById('menu-foods-grid');
  const catBar = document.getElementById('menu-categories-list');
  const pageHeader = document.querySelector('#menu-view .page-header-title');

  if (!grid) return;

  if (activeMenuFoodId) {
    if (catBar) catBar.style.display = 'none';
    if (pageHeader) pageHeader.style.display = 'none';

    const food = FOOD_ITEMS.find(f => f.id === activeMenuFoodId);
    if (food) {
      grid.innerHTML = renderMenuFoodDetail(food);
      return;
    } else {
      activeMenuFoodId = null;
    }
  }

  if (catBar) catBar.style.display = 'flex';
  if (pageHeader) pageHeader.style.display = 'block';

  let foods = FOOD_ITEMS;

  if (selectedCategory !== 'all') {
    foods = foods.filter(f => f.category === selectedCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    foods = foods.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }

  // Group by category if "all" is selected
  if (selectedCategory === 'all' && searchQuery.trim() === '') {
    const categoriesToDisplay = ['burgers', 'pizza', 'chicken', 'rice', 'sandwich', 'drinks', 'desserts'];
    grid.innerHTML = categoriesToDisplay.map(catKey => {
      const catObj = FOOD_CATEGORIES.find(c => c.id === catKey);
      const catFoods = FOOD_ITEMS.filter(f => f.category === catKey);
      if (catFoods.length === 0) return '';

      return `
        <div class="menu-category-section">
          <h2 class="menu-section-title">${catObj.icon} ${catObj.name}</h2>
          <div class="food-cards-grid">
            ${catFoods.map(food => renderFoodCard(food, false, true)).join('')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    grid.innerHTML = `
      <div class="food-cards-grid">
        ${foods.map(food => renderFoodCard(food, false, true)).join('')}
      </div>
    `;
  }
}


let currentOffersFilter = 'all';

function filterOffers(filterType, btnEl) {
  currentOffersFilter = filterType;
  if (btnEl) {
    const parent = btnEl.parentElement;
    if (parent) {
      parent.querySelectorAll('.filter-tab-pill').forEach(b => b.classList.remove('active'));
    }
    btnEl.classList.add('active');
  }
  renderOffersPage();
}

async function renderOffersPage() {
  const grid = document.getElementById('offers-cards-grid');
  const homeGrid = document.getElementById('home-offers-cards-grid');
  if (!grid && !homeGrid) return;

  // 1. Initial immediate render from in-memory / cache data
  let localOffers = typeof SPECIAL_OFFERS !== 'undefined' && Array.isArray(SPECIAL_OFFERS) && SPECIAL_OFFERS.length > 0
    ? [...SPECIAL_OFFERS]
    : [];

  const saved = localStorage.getItem('food_express_offers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localOffers = parsed;
      }
    } catch(e){}
  }

  // Render initial cards immediately
  renderOffersDOM(localOffers);

  // 2. Fetch fresh live offers from MySQL Database API
  try {
    const res = await fetch(`api/offers.php?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        localStorage.setItem('food_express_offers', JSON.stringify(data.data));
        if (typeof SPECIAL_OFFERS !== 'undefined') {
          SPECIAL_OFFERS.length = 0;
          data.data.forEach(o => SPECIAL_OFFERS.push(o));
        }
        renderOffersDOM(data.data);
      }
    }
  } catch (err) {
    console.warn('Using local offers dataset:', err.message);
  }
}

function renderOffersDOM(allOffers) {
  const grid = document.getElementById('offers-cards-grid');
  const homeGrid = document.getElementById('home-offers-cards-grid');
  if (!grid && !homeGrid) return;

  const colorPalettes = [
    { bg: 'linear-gradient(135deg, #4A0E17, #2A050A)', pillBg: '#EAB308', pillColor: '#1E1B4B', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' },
    { bg: 'linear-gradient(135deg, #D9480F, #A02C00)', pillBg: '#FFD43B', pillColor: '#000000', img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80' },
    { bg: 'linear-gradient(135deg, #065F46, #023E2C)', pillBg: '#34D399', pillColor: '#064E3B', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80' },
    { bg: 'linear-gradient(135deg, #581C87, #3B0764)', pillBg: '#C084FC', pillColor: '#3B0764', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' }
  ];

  // Filter active offers: is_active must be 1, '1', or true (default to true if undefined)
  let activeOffers = (allOffers || []).filter(o => o && (o.is_active === undefined || Number(o.is_active) === 1 || o.is_active === true || o.is_active === '1'));

  // Apply category/deal filter if selected
  if (currentOffersFilter !== 'all') {
    activeOffers = activeOffers.filter(offer => {
      let pIds = [];
      if (offer.product_ids) {
        try { pIds = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids) : offer.product_ids; } catch(e){}
      }
      const badgeLower = (offer.badge || '').toLowerCase();
      const titleLower = (offer.title || '').toLowerCase();
      const subLower = (offer.subtitle || '').toLowerCase();

      if (currentOffersFilter === 'combo') {
        return (Array.isArray(pIds) && pIds.length >= 2) || badgeLower.includes('combo') || titleLower.includes('combo') || titleLower.includes('fest') || titleLower.includes('feast') || titleLower.includes('deal');
      } else if (currentOffersFilter === 'discounts') {
        return offer.discount_type === 'percentage' || offer.discount_type === 'fixed';
      } else if (currentOffersFilter === 'delivery') {
        return offer.discount_type === 'free_delivery' || badgeLower.includes('delivery') || titleLower.includes('delivery');
      } else if (currentOffersFilter === 'limited') {
        return badgeLower.includes('hot') || badgeLower.includes('limited') || badgeLower.includes('deal') || badgeLower.includes('special') || badgeLower.includes('sweet') || subLower.includes('limited') || offer.discount_type === 'percentage';
      }
      return true;
    });
  }

  if (activeOffers.length === 0) {
    const filterLabels = { combo: 'Combo Deals', discounts: 'Discounts', delivery: 'Free Delivery', limited: 'Limited Time' };
    const filterName = filterLabels[currentOffersFilter];
    const emptyHtml = filterName ? `
      <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; background:#F8FAFC; border-radius:16px; border:2px dashed #CBD5E1;">
        <div style="font-size:40px; margin-bottom:12px; color:#EA580C;"><i class="fa-solid fa-tags"></i></div>
        <h3 style="font-size:20px; font-weight:700; color:#1E293B;">No Active Offers under "${filterName}"</h3>
        <p style="color:#64748B; font-size:14px; margin-top:4px; margin-bottom:16px;">Try selecting another filter or view all available deals.</p>
        <button onclick="filterOffers('all', document.querySelector('.filter-tab-pill'))" style="background:#EA580C; color:#FFF; font-weight:700; padding:10px 20px; border-radius:20px; border:none; cursor:pointer;">View All Offers →</button>
      </div>
    ` : `
      <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; background:#F8FAFC; border-radius:16px; border:2px dashed #CBD5E1;">
        <div style="font-size:40px; margin-bottom:12px; color:#EA580C;"><i class="fa-solid fa-tags"></i></div>
        <h3 style="font-size:20px; font-weight:700; color:#1E293B;">No Active Special Offers Available</h3>
        <p style="color:#64748B; font-size:14px; margin-top:4px;">Offers created or enabled from the Admin Panel will appear here.</p>
      </div>
    `;
    if (grid) grid.innerHTML = emptyHtml;
    if (homeGrid) homeGrid.innerHTML = emptyHtml;
    return;
  }

  const cardsHtml = activeOffers.map((offer, idx) => {
    const palette = colorPalettes[idx % colorPalettes.length];
    const discountVal = parseFloat(offer.discount_value || '0');
    let discountTagText = '';
    
    if (offer.discount_type === 'percentage') {
      discountTagText = `${discountVal}% OFF`;
    } else if (offer.discount_type === 'fixed') {
      discountTagText = `Rs. ${discountVal.toFixed(2)} OFF`;
    } else {
      discountTagText = 'FREE DELIVERY';
    }

    const minOrder = parseFloat(offer.min_order_amount || '0');

    // Resolve cover image
    let coverImg = offer.image_url;
    if (!coverImg && offer.product_ids) {
      try {
        const pIds = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids) : offer.product_ids;
        if (Array.isArray(pIds) && pIds.length > 0 && typeof FOOD_ITEMS !== 'undefined') {
          const matchedProd = FOOD_ITEMS.find(f => f.id === pIds[0]);
          if (matchedProd && matchedProd.image) coverImg = matchedProd.image;
        }
      } catch(e){}
    }
    if (!coverImg) coverImg = palette.img;

    return `
      <div class="offer-card" style="background: ${palette.bg}; border-radius: 24px; padding: 28px; position: relative; overflow: hidden; color: #FFFFFF; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 30px rgba(0,0,0,0.15); transition: transform 0.25s ease, box-shadow 0.25s ease;">
        
        <!-- Top Badges Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 16px; position: relative; z-index: 2;">
          <span style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #FFFFFF; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(offer.badge || 'SPECIAL OFFER')}
          </span>
          <span style="background: ${palette.pillBg}; color: ${palette.pillColor}; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            ${discountTagText}
          </span>
        </div>

        <!-- Content Middle -->
        <div style="position: relative; z-index: 2; max-width: 65%;">
          <h3 style="font-size: 24px; font-weight: 900; line-height: 1.15; margin-bottom: 6px; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(offer.title)}
          </h3>
          <p style="font-size: 13.5px; color: rgba(255, 255, 255, 0.85); margin-bottom: 14px; font-weight: 500;">
            ${escapeHtml(offer.subtitle || '')}
          </p>

          ${offer.code ? `
            <div style="display: inline-block; background: rgba(0, 0, 0, 0.25); border: 1px dashed rgba(255, 255, 255, 0.4); padding: 5px 12px; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 14px;">
              Use Code: ${escapeHtml(offer.code)}
            </div>
          ` : ''}

          <div>
            <button onclick="applyOfferCode('${escapeHtml(offer.code)}')" style="background: #FFD43B; color: #000000; font-size: 14px; font-weight: 800; padding: 10px 22px; border-radius: 24px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.2); transition: transform 0.2s ease;">
              ${offer.discount_type === 'free_delivery' ? 'Apply Code' : 'Order Now →'}
            </button>
          </div>

          <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.7); margin-top: 10px; font-weight: 500;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ${minOrder > 0 ? `Min order Rs. ${minOrder.toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'Best value guaranteed!'}
          </div>
        </div>

        <!-- Bottom Right Image Circle -->
        <div style="position: absolute; right: -15px; bottom: -15px; width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 4px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 20px rgba(0,0,0,0.25); pointer-events: none;">
          <img src="${coverImg}" alt="${escapeHtml(offer.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

      </div>
    `;
  }).join('');

  if (grid) grid.innerHTML = cardsHtml;
  if (homeGrid) homeGrid.innerHTML = cardsHtml;
}

function applyOfferCode(code) {
  let productIds = [];
  const saved = localStorage.getItem('food_express_offers');
  let offers = typeof SPECIAL_OFFERS !== 'undefined' ? [...SPECIAL_OFFERS] : [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) offers = parsed;
    } catch(e){}
  }
  const matched = offers.find(o => o.code && o.code.toUpperCase() === (code || '').toUpperCase());
  if (matched && matched.product_ids) {
    try {
      productIds = typeof matched.product_ids === 'string' ? JSON.parse(matched.product_ids) : matched.product_ids;
    } catch (e) {}
  }

  if (Array.isArray(productIds) && productIds.length > 0) {
    productIds.forEach(id => {
      if (typeof cartManager !== 'undefined') cartManager.addItem(id, 1);
    });
  }

  if (typeof cartManager !== 'undefined') {
    cartManager.applyPromoCode(code);
  }

  if (typeof router !== 'undefined' && typeof router.navigateTo === 'function') {
    router.navigateTo('checkout');
  }
}

function renderAboutPage() {
  const container = document.getElementById('about-journey-timeline');
  if (!container) return;

  container.innerHTML = MILESTONES.map((m, index) => `
    <div class="timeline-step">
      <div class="timeline-dot-wrap">
        <div class="timeline-dot">${index + 1}</div>
      </div>
      <div class="timeline-year">${m.year}</div>
      <p class="timeline-text">${m.text}</p>
    </div>
  `).join('');
}

function setupSearchHandler() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderFeaturedFoods();
      renderMenuPage();
    });
  }
}

function setupModalHandlers() {
  // Mobile cart sidebar toggle
  const cartToggleBtn = document.getElementById('mobile-cart-toggle');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart-btn');

  if (cartToggleBtn && cartSidebar) {
    cartToggleBtn.addEventListener('click', () => {
      cartSidebar.classList.add('mobile-open');
      if (cartOverlay) cartOverlay.classList.add('active');
    });
  }

  if (closeCartBtn && cartSidebar) {
    closeCartBtn.addEventListener('click', () => {
      cartSidebar.classList.remove('mobile-open');
      if (cartOverlay) cartOverlay.classList.remove('active');
    });
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
      cartSidebar.classList.remove('mobile-open');
      cartOverlay.classList.remove('active');
    });
  }

  // Backdrop overlay click to close modals
  ['checkout-modal', 'auth-modal', 'user-profile-modal', 'user-orders-modal', 'user-favorites-modal'].forEach(id => {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          modalEl.classList.remove('active');
          modalEl.style.display = 'none';
        }
      });
    }
  });

  // Profile Popover Dropdown Toggle
  const profileTriggerBtn = document.getElementById('profile-trigger-btn');
  const profilePopoverCard = document.getElementById('profile-popover-card');
  const profileWrapper = document.getElementById('profile-dropdown-wrapper');

  if (profileTriggerBtn && profilePopoverCard && profileWrapper) {
    if (!profileTriggerBtn.dataset.headerBound) {
      profileTriggerBtn.dataset.headerBound = 'true';
      profileTriggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        profilePopoverCard.classList.toggle('show');
        profileWrapper.classList.toggle('active');
      });
    }

    if (!window._headerGlobalClickBound) {
      window._headerGlobalClickBound = true;
      document.addEventListener('click', (e) => {
        if (profileWrapper && !profileWrapper.contains(e.target) && profilePopoverCard) {
          profilePopoverCard.classList.remove('show');
          profileWrapper.classList.remove('active');
        }
      });
    }
  }
}

function closeUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function closeUserOrdersModal() {
  const modal = document.getElementById('user-orders-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function closeUserFavoritesModal() {
  const modal = document.getElementById('user-favorites-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

async function openUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');

  const nameEl = document.getElementById('profile-modal-name');
  const emailEl = document.getElementById('profile-modal-email');
  const phoneEl = document.getElementById('profile-modal-phone');
  const roleEl = document.getElementById('profile-modal-role');
  const addrEl = document.getElementById('profile-modal-address');
  const ordersEl = document.getElementById('profile-modal-orders');
  const joinedEl = document.getElementById('profile-modal-joined');

  const userJson = localStorage.getItem('food_express_user');
  if (!userJson) {
    if (nameEl) nameEl.textContent = 'Guest User';
    if (emailEl) emailEl.textContent = 'Not Logged In';
    if (phoneEl) phoneEl.textContent = 'N/A';
    if (roleEl) roleEl.textContent = 'Visitor';
    if (addrEl) addrEl.textContent = 'Please login to save delivery address';
    if (ordersEl) ordersEl.textContent = '0 Orders';
    if (joinedEl) joinedEl.textContent = 'N/A';
    return;
  }

  try {
    const user = JSON.parse(userJson);
    const userId = user.id || '';
    const email = user.email || '';

    if (nameEl) nameEl.textContent = user.name || 'User';
    if (emailEl) emailEl.textContent = user.email || 'N/A';
    if (phoneEl) phoneEl.textContent = user.phone || 'N/A';
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'System Administrator' : 'Registered Customer';

    // Fetch live data from MySQL API
    const res = await fetch(`api/auth.php?action=profile&id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.status === 'success' && data.user) {
      const u = data.user;
      const resolveAddress = (obj) => {
        if (!obj) return '';
        let str = '';
        if (typeof obj === 'string') str = obj.trim();
        else if (typeof obj === 'object') {
          const line = (obj.address_line || obj.address || '').trim();
          const city = (obj.city || '').trim();
          str = (city && city.toLowerCase() !== 'colombo') ? `${line}, ${city}` : line;
        }
        return str.replace(/^[\s,]+|[\s,]+$/g, '');
      };

      if (nameEl) nameEl.textContent = u.name || 'User';
      if (emailEl) emailEl.textContent = u.email || 'N/A';
      if (phoneEl) phoneEl.textContent = u.phone || (u.address && typeof u.address === 'object' ? u.address.phone : '') || user.phone || 'Not Provided';
      if (roleEl) roleEl.textContent = u.role === 'admin' ? 'System Administrator' : 'Registered Customer';
      
      if (addrEl) {
        let addrStr = resolveAddress(u.address) || resolveAddress(u.saved_address) || resolveAddress(user.address) || resolveAddress(user.saved_address);
        addrStr = addrStr.replace(/^[\s,]+|[\s,]+$/g, '');
        addrEl.textContent = addrStr || 'No saved address';
      }
      if (ordersEl) ordersEl.textContent = `${u.total_orders || 0} Orders`;
      if (joinedEl) joinedEl.textContent = u.created_at ? new Date(u.created_at).toLocaleDateString() : '2026';
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
  }
}

async function openUserOrdersModal() {
  const modal = document.getElementById('user-orders-modal');
  const container = document.getElementById('user-orders-list-body');
  if (!modal || !container) return;

  modal.style.display = 'flex';
  modal.classList.add('active');
  container.innerHTML = '<div style="padding:40px; text-align:center; color:#64748B;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:#EA3829;"></i><p style="margin-top:10px;">Loading your order history...</p></div>';

  try {
    const userJson = localStorage.getItem('food_express_user');
    const user = userJson ? JSON.parse(userJson) : {};
    const userId = user.id || '';
    const email = user.email || '';

    const res = await fetch(`api/orders.php?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      container.innerHTML = data.data.map(order => {
        const statusColors = {
          'pending': { bg: '#FEF3C7', color: '#D97706', text: 'Pending' },
          'preparing': { bg: '#E0F2FE', color: '#0284C7', text: 'Preparing' },
          'delivered': { bg: '#D1FAE5', color: '#059669', text: 'Delivered' },
          'cancelled': { bg: '#FEE2E2', color: '#DC2626', text: 'Cancelled' }
        };
        const st = statusColors[order.order_status?.toLowerCase()] || statusColors['pending'];
        const itemsHtml = Array.isArray(order.items) && order.items.length > 0 ? order.items.map(it => {
          const qty = parseInt(it.quantity || it.qty || 1, 10) || 1;
          const unitPrice = parseFloat(it.unit_price ?? it.price ?? it.item_price ?? 0) || 0;
          const itemTotal = parseFloat(it.total_price ?? it.total) || (qty * unitPrice);
          return `
            <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
              <img src="${it.image_url || 'images/foods/burger-1.jpg'}" style="width:36px; height:36px; border-radius:8px; object-fit:cover;" />
              <div style="flex:1;">
                <span style="font-size:13px; font-weight:600; color:#1E293B;">${escapeHtml(it.product_name || 'Food Item')}</span>
                <span style="font-size:11px; color:#64748B; display:block;">Qty: ${qty} x Rs. ${unitPrice.toFixed(2)}</span>
              </div>
              <strong style="font-size:13px; color:#0F172A;">Rs. ${itemTotal.toFixed(2)}</strong>
            </div>
          `;
        }).join('') : `<p style="font-size:12px; color:#64748B; margin:4px 0;">Subtotal: Rs. ${(parseFloat(order.subtotal || order.total_amount) || 0).toFixed(2)}</p>`;

        const grandTotal = parseFloat(order.total_amount || order.total || 0) || 0;

        return `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px;">
            <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px dashed #CBD5E1; padding-bottom:10px;">
              <div>
                <strong style="font-size:14px; color:#0F172A;">Order #${order.id}</strong>
                <span style="display:block; font-size:11px; color:#64748B;">${new Date(order.created_at).toLocaleString()}</span>
              </div>
              <span style="background:${st.bg}; color:${st.color}; font-size:11px; font-weight:700; padding:4px 10px; border-radius:9999px;">${st.text}</span>
            </div>
            <div style="padding:10px 0;">${itemsHtml}</div>
            <div style="border-top:1px solid #E2E8F0; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#64748B;">Payment: ${order.payment_method?.toUpperCase()}</span>
              <strong style="font-size:15px; color:#EA3829;">Total: Rs. ${grandTotal.toFixed(2)}</strong>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = `
        <div style="padding:50px 20px; text-align:center; color:#94A3B8;">
          <i class="fa-solid fa-box-open" style="font-size:40px; color:#CBD5E1; margin-bottom:12px; display:block;"></i>
          <h4 style="margin:0; font-size:15px; color:#475569;">No Orders Found</h4>
          <p style="font-size:12px; margin-top:4px;">You haven't placed any food orders yet!</p>
        </div>`;
    }
  } catch (err) {
    container.innerHTML = '<div style="padding:30px; text-align:center; color:#EF4444;">Failed to load order history.</div>';
  }
}

function openUserFavoritesModal() {
  syncWishlistForCurrentUser();
  const modal = document.getElementById('user-favorites-modal');
  const container = document.getElementById('user-favorites-list-body');
  if (!modal || !container) return;

  modal.style.display = 'flex';
  modal.classList.add('active');
  
  const allFoods = typeof FOOD_ITEMS !== 'undefined' ? FOOD_ITEMS : (typeof foodItems !== 'undefined' ? foodItems : []);
  const favItems = allFoods.filter(f => wishlist.has(f.id) || wishlist.has(String(f.id)) || (typeof f.id === 'number' && wishlist.has(Number(f.id))));

  if (favItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; padding:50px 20px; text-align:center; color:#94A3B8;">
        <i class="fa-regular fa-heart" style="font-size:40px; color:#CBD5E1; margin-bottom:12px; display:block;"></i>
        <h4 style="margin:0; font-size:15px; color:#475569;">No Saved Favorites</h4>
        <p style="font-size:12px; margin-top:4px;">Click the heart icon on any food item to save it here!</p>
      </div>`;
    return;
  }

  container.innerHTML = favItems.map(food => `
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; flex-direction:column; justify-content:space-between;">
      <div style="display:flex; gap:12px; align-items:center;">
        <img src="${food.image}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;" />
        <div>
          <h4 style="margin:0; font-size:14px; font-weight:700; color:#0F172A;">${escapeHtml(food.name)}</h4>
          <span style="font-size:13px; font-weight:800; color:#EA3829;">Rs. ${food.price.toFixed(2)}</span>
        </div>
      </div>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button onclick="cartManager.addItem('${food.id}'); if(window.NotificationSystem) NotificationSystem.add('${escapeHtml(food.name)} added to cart!', 'success');" style="flex:1; background:#EA3829; color:#FFF; border:none; border-radius:8px; padding:8px; font-size:12px; font-weight:700; cursor:pointer;">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
        <button onclick="toggleWishlist('${food.id}'); openUserFavoritesModal();" style="background:#FEE2E2; color:#EF4444; border:none; border-radius:8px; width:34px; height:34px; cursor:pointer;" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function handleProfileOption(optionName) {
  const profilePopoverCard = document.getElementById('profile-popover-card');
  const profileWrapper = document.getElementById('profile-dropdown-wrapper');
  if (profilePopoverCard) profilePopoverCard.classList.remove('show');
  if (profileWrapper) profileWrapper.classList.remove('active');

  const pagePrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';

  if (optionName === 'Logout') {
    localStorage.removeItem('food_express_user');
    updateUserProfileUI();
    if (window.NotificationSystem) NotificationSystem.add('Logged out successfully. Redirecting to Login 👋', 'info');
    setTimeout(() => { window.location.href = pagePrefix + 'login.html'; }, 600);
  } else if (optionName === 'My Profile') {
    window.location.href = pagePrefix + 'profile.html';
  } else if (optionName === 'My Orders') {
    window.location.href = pagePrefix + 'orders.html';
  } else if (optionName === 'Favorites') {
    window.location.href = pagePrefix + 'favorites.html';
  }
}

function updateUserProfileUI() {
  const savedUserJson = localStorage.getItem('food_express_user');
  const nameEl = document.querySelector('.user-display-name');
  const emailEl = document.querySelector('.user-display-email');
  
  if (savedUserJson) {
    try {
      const user = JSON.parse(savedUserJson);
      if (nameEl) nameEl.textContent = user.name || 'User';
      if (emailEl) emailEl.textContent = user.email + (user.role === 'admin' ? ' (Admin)' : '');
    } catch (e) {}
  } else {
    if (nameEl) nameEl.textContent = 'Guest User';
    if (emailEl) emailEl.textContent = 'Click to Login / Register';
  }
}

function openCheckoutModal() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
  router.navigateTo('checkout');
}

function getSavedDeliveryDetails() {
  let user = null;
  const userJson = localStorage.getItem('food_express_user');
  if (userJson) {
    try { user = JSON.parse(userJson); } catch (_) {}
  }

  const userId = user ? user.id : 'guest';
  const savedJson = localStorage.getItem('food_express_saved_address_' + userId) || localStorage.getItem('food_express_saved_address');
  
  let saved = {};
  if (savedJson) {
    try { saved = JSON.parse(savedJson); } catch (_) {}
  }

  const savedAddrObj = user?.saved_address || {};
  const userAddress = typeof user?.address === 'string' ? user.address : (user?.address?.address_line || '');

  return {
    name: saved.name || (user ? user.name : ''),
    email: saved.email || (user ? user.email : ''),
    phone: saved.phone || (user ? user.phone : (savedAddrObj.phone || '')),
    address: saved.address || userAddress || (savedAddrObj.address_line || ''),
    city: saved.city || (savedAddrObj.city || '')
  };
}

function populateCheckoutForm() {
  const details = getSavedDeliveryDetails();

  const nameInput = document.getElementById('co-name');
  const phoneInput = document.getElementById('co-phone');
  const emailInput = document.getElementById('co-email');
  const addressInput = document.getElementById('co-address');
  const cityInput = document.getElementById('co-city');

  if (nameInput && details.name) nameInput.value = details.name;
  if (phoneInput && details.phone) phoneInput.value = details.phone;
  if (emailInput && details.email) emailInput.value = details.email;
  if (addressInput && details.address) addressInput.value = details.address;
  if (cityInput && details.city) cityInput.value = details.city;
}

function showTrackingPage(orderId) {
  const formContainer = document.getElementById('checkout-form-container');
  const trackingContainer = document.getElementById('checkout-tracking-container');
  const orderIdEl = document.getElementById('checkout-order-id');
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (formContainer) formContainer.style.display = 'none';
  if (trackingContainer) trackingContainer.style.display = 'block';

  const t1 = document.getElementById('page-track-1');
  const t2 = document.getElementById('page-track-2');
  const t3 = document.getElementById('page-track-3');
  const t4 = document.getElementById('page-track-4');

  if (t1) t1.className = 'track-step completed';
  if (t2) t2.className = 'track-step active';
  if (t3) t3.className = 'track-step';
  if (t4) t4.className = 'track-step';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function checkPaymentSuccessCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const payment = urlParams.get('payment');
  const orderId = urlParams.get('order_id');

  if (payment === 'success' && orderId) {
    // 1. Mark order as paid in database if not already updated by notify_url
    try {
      await fetch('api/mark_paid.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
    } catch (err) {
      console.warn('mark_paid error:', err);
    }

    // 2. Clear customer cart now that payment is confirmed
    if (typeof cartManager !== 'undefined') {
      cartManager.clearCart();
    }

    // 3. Ensure router navigates to checkout view
    if (typeof router !== 'undefined') {
      router.navigateTo('checkout');
    }

    // 4. Show the tracking / Order Placed Successfully screen
    showTrackingPage(orderId);

    // 5. Clean query params from URL so refreshing won't re-trigger, but keep #checkout
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname + '#checkout';
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
}

function resetCheckoutView() {
  const formContainer = document.getElementById('checkout-form-container');
  const trackingContainer = document.getElementById('checkout-tracking-container');

  if (formContainer) formContainer.style.display = 'block';
  if (trackingContainer) trackingContainer.style.display = 'none';

  const t1 = document.getElementById('page-track-1');
  const t2 = document.getElementById('page-track-2');
  const t3 = document.getElementById('page-track-3');
  const t4 = document.getElementById('page-track-4');

  if (t1) t1.className = 'track-step completed';
  if (t2) t2.className = 'track-step active';
  if (t3) t3.className = 'track-step';
  if (t4) t4.className = 'track-step';
}

function renderCheckoutPage() {
  const formContainer = document.getElementById('checkout-form-container');
  const trackingContainer = document.getElementById('checkout-tracking-container');

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success' && urlParams.get('order_id')) {
    showTrackingPage(urlParams.get('order_id'));
    return;
  }

  // If tracking container is currently visible, preserve it and don't reset to the form
  if (trackingContainer && trackingContainer.style.display === 'block') {
    return;
  }

  const items = cartManager.getCartItems();

  // If there are items in the cart, reset checkout view to show form for the new order
  if (items.length > 0) {
    if (formContainer) formContainer.style.display = 'block';
    if (trackingContainer) trackingContainer.style.display = 'none';
  }

  const subtotalEl = document.getElementById('checkout-page-subtotal');
  const feeEl = document.getElementById('checkout-page-delivery-fee');
  const totalEl = document.getElementById('checkout-page-total');
  const discountRowEl = document.getElementById('checkout-page-discount-row');
  const discountCodeEl = document.getElementById('checkout-page-discount-code');
  const discountValEl = document.getElementById('checkout-page-discount-val');

  const subtotal = cartManager.getSubtotal();
  const deliveryFee = typeof cartManager.getDeliveryFee === 'function' ? cartManager.getDeliveryFee() : (items.length > 0 ? (cartManager.appliedCode === 'FREE15' ? 0 : 250) : 0);
  const discountVal = typeof cartManager.getDiscountAmount === 'function' ? cartManager.getDiscountAmount() : (cartManager.appliedDiscount > 0 ? subtotal * cartManager.appliedDiscount : 0);
  const grandTotal = items.length > 0 ? cartManager.getTotal() : 0;

  if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  
  if (feeEl) {
    feeEl.textContent = (deliveryFee === 0 && items.length > 0) ? 'FREE' : `Rs. ${deliveryFee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  if (discountRowEl) {
    if (discountVal > 0) {
      discountRowEl.style.display = 'flex';
      if (discountCodeEl) discountCodeEl.textContent = cartManager.appliedCode || 'Offer Discount';
      if (discountValEl) discountValEl.textContent = `-Rs. ${discountVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else if (cartManager.appliedCode === 'FREE15' || (cartManager.appliedOffer && cartManager.appliedOffer.discount_type === 'free_delivery')) {
      discountRowEl.style.display = 'flex';
      if (discountCodeEl) discountCodeEl.textContent = `${cartManager.appliedCode || 'Free Delivery'} (Free Delivery)`;
      if (discountValEl) discountValEl.textContent = 'Rs. 0.00';
    } else {
      discountRowEl.style.display = 'none';
    }
  }

  if (totalEl) totalEl.textContent = `Rs. ${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  // Auto-fill checkout fields so the same person never has to re-enter their details
  populateCheckoutForm();
}

function selectPaymentMethod(method) {
  const codCard = document.getElementById('pm-cod-card');
  const cardCard = document.getElementById('pm-card-card');
  const codRadio = document.getElementById('pm-cod-radio');
  const cardRadio = document.getElementById('pm-card-radio');
  const cardDetails = document.getElementById('card-details-box');

  if (method === 'cod') {
    if (codCard) codCard.classList.add('active');
    if (cardCard) cardCard.classList.remove('active');
    if (codRadio) codRadio.checked = true;
    if (cardRadio) cardRadio.checked = false;
    if (cardDetails) cardDetails.style.display = 'none';
  } else {
    if (cardCard) cardCard.classList.add('active');
    if (codCard) codCard.classList.remove('active');
    if (cardRadio) cardRadio.checked = true;
    if (codRadio) codRadio.checked = false;
    if (cardDetails) cardDetails.style.display = 'block';
    populateCheckoutForm();
  }
}

async function handleCheckoutPagePlaceOrder(e) {
  e.preventDefault();

  if (cartManager.cart.length === 0) {
    cartManager.showToast('Your cart is empty! Add items before placing an order.', 'error');
    return;
  }

  const name = document.getElementById('co-name')?.value.trim() || '';
  const phone = document.getElementById('co-phone')?.value.trim() || '';
  const email = document.getElementById('co-email')?.value.trim() || '';
  const address = document.getElementById('co-address')?.value.trim() || '';
  const city = document.getElementById('co-city')?.value.trim() || '';

  if (!name || !phone || !email || !address || !city) {
    cartManager.showToast('Please fill in all delivery information.', 'error');
    return;
  }

  const paymentRadio = document.querySelector('input[name="payment_method"]:checked');
  const paymentMethod = paymentRadio ? paymentRadio.value : 'cod';

  let userId = null;
  let user = null;
  const loggedUserJson = localStorage.getItem('food_express_user');
  if (loggedUserJson) {
    try {
      user = JSON.parse(loggedUserJson);
      userId = user.id || null;
    } catch (_) {}
  }

  const savedDetails = { name, phone, email, address, city };
  const userKey = userId ? ('food_express_saved_address_' + userId) : 'food_express_saved_address';
  localStorage.setItem(userKey, JSON.stringify(savedDetails));

  if (user) {
    user.phone = phone;
    user.saved_address = { address_line: address, city, phone };
    localStorage.setItem('food_express_user', JSON.stringify(user));
  }

  const deliveryDetails = { name, phone, email, address, city, paymentMethod, userId };
  // IMPORTANT: capture the amount BEFORE an order can clear the cart.
  const totalAmount = cartManager.getTotal();

  // CARD: create a pending order but KEEP the cart, then redirect directly
  // to the official PayHere Sandbox checkout page. This avoids showing the
  // local Order Placed view before the customer has actually gone through PayHere.
  if (paymentMethod === 'card') {
    const result = await cartManager.placeOrder(deliveryDetails, { preserveCart: true });
    if (!result || !result.order_id) return;
    const realOrderId = result.order_id;

    try {
      cartManager.showToast('Redirecting to PayHere Sandbox...', 'info');
      const payhereRes = await fetch('api/payhere.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: realOrderId,
          amount: totalAmount,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          address,
          city
        })
      });

      const payhereData = await payhereRes.json();
      if (!payhereRes.ok || payhereData.status !== 'success' || !payhereData.payhere_params) {
        throw new Error(payhereData.message || 'Could not prepare PayHere payment');
      }

      // Direct browser POST to PayHere Sandbox. Do not clear the cart and do not
      // show the success page here. PayHere controls the payment screen first.
      submitPayHereForm(payhereData.payhere_params);
      return;
    } catch (err) {
      console.error('PayHere Redirect Error:', err);
      cartManager.showToast(err.message || 'Unable to open PayHere Sandbox.', 'error');
      return;
    }
  }

  // CASH ON DELIVERY: place immediately and then show the success/tracking view.
  const result = await cartManager.placeOrder(deliveryDetails);
  if (result && result.order_id) showTrackingPage(result.order_id);
}

function submitPayHereForm(params) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = params.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout';

  for (const key in params) {
    if (params.hasOwnProperty(key) && key !== 'sandbox') {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = key;
      hiddenField.value = params[key];
      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('active');
}

/* Authentication & Login Modal Helpers */
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    switchAuthTab(tab);
    modal.classList.add('active');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginBtn = document.getElementById('tab-login-btn');
  const signupBtn = document.getElementById('tab-signup-btn');
  const subtitleText = document.getElementById('auth-subtitle-text');

  if (tab === 'login') {
    if (loginForm) loginForm.classList.add('active');
    if (signupForm) signupForm.classList.remove('active');
    if (loginBtn) loginBtn.classList.add('active');
    if (signupBtn) signupBtn.classList.remove('active');
    if (subtitleText) subtitleText.textContent = 'Welcome back! Sign in to order your favorite food.';
  } else {
    if (signupForm) signupForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
    if (signupBtn) signupBtn.classList.add('active');
    if (loginBtn) loginBtn.classList.remove('active');
    if (subtitleText) subtitleText.textContent = 'Join Food Express today & get exclusive discounts!';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast('Please enter both email and password.', 'error');
    }
    return;
  }

  try {
    const res = await fetch('api/auth.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'customer' })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      localStorage.setItem('food_express_user', JSON.stringify(data.user));
      updateUserProfileUI();
      closeAuthModal();
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast(`Welcome back, ${data.user.name}! Signed in successfully. <i class="fa-solid fa-circle-check" style="color:#22C55E;"></i>`, 'success');
      }
      return;
    }

    // Account not found in database users table
    if (res.status === 404 || data.error_code === 'ACCOUNT_NOT_FOUND' || (data.message && data.message.includes('No account found'))) {
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast('No account found for this email in the database. Please switch to Sign Up to register first.', 'error');
      }
      switchAuthTab('signup');
      const signupEmail = document.getElementById('signup-email');
      if (signupEmail) signupEmail.value = email;
      return;
    }

    if (res.status === 401 || data.error_code === 'INVALID_PASSWORD') {
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast('Incorrect password. Please try again.', 'error');
      }
      return;
    }

    throw new Error(data.message || 'Login failed.');

  } catch (err) {
    console.warn('Authentication error:', err.message);
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast('Authentication error: Only registered users in the database can log in.', 'error');
    }
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!name || !email || !password) {
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast('Please fill in all fields to register.', 'error');
    }
    return;
  }

  if (password.length < 6) {
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast('Password must be at least 6 characters.', 'error');
    }
    return;
  }

  try {
    const res = await fetch('api/auth.php?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'customer' })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      const registeredUser = {
        id: data.user?.id || 'usr_' + Date.now(),
        name: name,
        email: email,
        password: password,
        role: 'customer'
      };

      // Save to client registry
      const localUsers = JSON.parse(localStorage.getItem('food_express_registered_users') || '[]');
      if (!localUsers.some(u => u.email.toLowerCase().trim() === email)) {
        localUsers.push(registeredUser);
        localStorage.setItem('food_express_registered_users', JSON.stringify(localUsers));
      }

      localStorage.setItem('food_express_user', JSON.stringify({
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role
      }));

      updateUserProfileUI();
      closeAuthModal();
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast(`Account created! Welcome to Food Express, ${name}! <i class="fa-solid fa-circle-check" style="color:#22C55E;"></i>`, 'success');
      }
      return;
    }

    if (res.status === 409 || (data.message && data.message.includes('already exists'))) {
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast('An account with this email already exists. Please sign in.', 'error');
      }
      switchAuthTab('login');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;
      return;
    }

    throw new Error(data.message || 'Registration failed.');

  } catch (err) {
    console.warn('Registering locally in client store:', err.message);
    const localUsers = JSON.parse(localStorage.getItem('food_express_registered_users') || '[]');
    if (localUsers.some(u => u.email.toLowerCase().trim() === email)) {
      if (typeof cartManager !== 'undefined' && cartManager.showToast) {
        cartManager.showToast('An account with this email already exists. Please sign in.', 'error');
      }
      switchAuthTab('login');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name,
      email: email,
      password: password,
      role: 'customer'
    };
    localUsers.push(newUser);
    localStorage.setItem('food_express_registered_users', JSON.stringify(localUsers));
    localStorage.setItem('food_express_user', JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }));

    updateUserProfileUI();
    closeAuthModal();
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast(`Account created! Welcome to Food Express, ${name}! <i class="fa-solid fa-circle-check" style="color:#22C55E;"></i>`, 'success');
    }
  }
}

/* ==========================================================================
   FULL DEDICATED CART PAGE CONTROLLER
   ========================================================================== */
function renderCartPage() {
  const itemsCountEl = document.getElementById('cart-page-items-count');
  const itemsListEl = document.getElementById('cart-page-items-list');
  const subtotalEl = document.getElementById('cart-page-subtotal');
  const deliveryFeeEl = document.getElementById('cart-page-delivery-fee');
  const totalEl = document.getElementById('cart-page-total');
  const discountRowEl = document.getElementById('cart-page-discount-row');
  const discountCodeEl = document.getElementById('cart-page-applied-code');
  const discountValEl = document.getElementById('cart-page-discount-val');
  const recommendationsEl = document.getElementById('cart-page-recommendations');

  if (!itemsListEl) return;

  const items = cartManager.getCartItems();
  const itemCount = cartManager.getCartCount();

  if (itemsCountEl) itemsCountEl.textContent = itemCount;

  if (items.length === 0) {
    itemsListEl.innerHTML = `
      <div class="empty-cart-page">
        <div class="empty-cart-icon"><i class="fa-solid fa-cart-shopping"></i></div>
        <h3>Your Shopping Cart is Empty</h3>
        <p>Looks like you haven't added anything to your cart yet. Explore our delicious menu and satisfy your cravings!</p>
        <button class="btn-primary-explore" onclick="router.navigateTo('menu')">
          Explore Menu →
        </button>
      </div>
    `;
  } else {
    itemsListEl.innerHTML = `
      <table class="cart-items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr data-id="${item.id}">
              <td class="cart-product-cell">
                <img src="${item.image}" alt="${item.name}" class="cart-table-img" />
                <div class="cart-table-details">
                  <h4 class="cart-table-title">${item.name}</h4>
                  <span class="cart-table-cat">${item.category ? item.category.toUpperCase() : 'FOOD'}</span>
                </div>
              </td>
              <td class="cart-price-cell">Rs. ${item.price.toFixed(2)}</td>
              <td class="cart-qty-cell">
                <div class="table-qty-picker">
                  <button class="qty-btn" onclick="cartManager.updateQuantity('${item.id}', -1)">-</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button class="qty-btn" onclick="cartManager.updateQuantity('${item.id}', 1)">+</button>
                </div>
              </td>
              <td class="cart-subtotal-cell">Rs. ${item.total.toFixed(2)}</td>
              <td class="cart-action-cell">
                <button class="btn-remove-item" onclick="cartManager.removeItem('${item.id}')" title="Remove item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Subtotal & Delivery Fee & Total
  const subtotal = cartManager.getSubtotal();
  const deliveryFee = items.length > 0 ? (cartManager.appliedCode === 'FREE15' ? 0 : 250) : 0;
  const discountVal = cartManager.appliedDiscount > 0 ? (subtotal * cartManager.appliedDiscount) : 0;
  const total = cartManager.getTotal();

  if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toFixed(2)}`;

  if (deliveryFeeEl) {
    if (deliveryFee > 0) {
      deliveryFeeEl.className = '';
      deliveryFeeEl.style.color = '#0F172A';
      deliveryFeeEl.style.fontWeight = '700';
      deliveryFeeEl.textContent = `Rs. ${deliveryFee.toFixed(2)}`;
    } else if (items.length > 0) {
      deliveryFeeEl.className = 'free-fee-badge';
      deliveryFeeEl.textContent = 'FREE';
    } else {
      deliveryFeeEl.className = '';
      deliveryFeeEl.style.color = '#64748B';
      deliveryFeeEl.textContent = 'Rs. 0.00';
    }
  }

  if (totalEl) totalEl.textContent = `Rs. ${total.toFixed(2)}`;

  // Discount
  if (discountRowEl) {
    if (cartManager.appliedDiscount > 0) {
      discountRowEl.style.display = 'flex';
      if (discountCodeEl) discountCodeEl.textContent = cartManager.appliedCode || '20% OFF';
      if (discountValEl) discountValEl.textContent = `-Rs. ${discountVal.toFixed(2)}`;
    } else if (cartManager.appliedCode === 'FREE15') {
      discountRowEl.style.display = 'flex';
      if (discountCodeEl) discountCodeEl.textContent = 'FREE15 (Free Delivery)';
      if (discountValEl) discountValEl.textContent = 'Rs. 0.00';
    } else {
      discountRowEl.style.display = 'none';
    }
  }

  // Recommendations (Items not currently in cart)
  if (recommendationsEl) {
    const cartIds = items.map(i => i.id);
    const recs = FOOD_ITEMS.filter(f => !cartIds.includes(f.id)).slice(0, 4);
    recommendationsEl.innerHTML = recs.map(rec => `
      <div class="recommendation-mini-card">
        <img src="${rec.image}" alt="${rec.name}" class="rec-img" />
        <div class="rec-info">
          <h5 class="rec-title">${rec.name}</h5>
          <span class="rec-price">Rs. ${rec.price.toFixed(2)}</span>
        </div>
        <button class="btn-rec-add" onclick="cartManager.addItem('${rec.id}', 1)" title="Add to Cart">+</button>
      </div>
    `).join('');
  }
}

function handleFullCartPromoSubmit() {
  const inputEl = document.getElementById('cart-page-promo-input');
  if (!inputEl) return;
  const code = inputEl.value;
  if (cartManager.applyPromoCode(code)) {
    inputEl.value = '';
  }
}

function applyQuickPromo(code) {
  const inputEl = document.getElementById('cart-page-promo-input');
  if (inputEl) inputEl.value = code;
  cartManager.applyPromoCode(code);
}

/* ==========================================================================
   CONTACT FORM HANDLER (Connected to MySQL & Admin Panel)
   ========================================================================== */
async function sendContactMessageToDatabase(payload) {
  // Candidate API endpoints to handle relative paths, virtual hosts, and Live Server
  const candidateUrls = [
    'api/contact.php',
    '/website/api/contact.php',
    'http://localhost/website/api/contact.php',
    'http://127.0.0.1/website/api/contact.php'
  ];

  // If running on file:// or static dev port (e.g. 5500, 3000, 8080), prioritize absolute localhost URLs
  if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '80' && window.location.port !== '443'))) {
    candidateUrls.unshift('http://localhost/website/api/contact.php', 'http://127.0.0.1/website/api/contact.php');
  }

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        // If response is not JSON (e.g., static server returned raw PHP text or HTML 404), skip to next candidate
        continue;
      }

      if (response.ok && data && (data.status === 'success' || data.id)) {
        return data;
      } else if (data && data.message) {
        throw new Error(data.message);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not connect to database API. Please ensure Apache and MySQL are running in XAMPP.');
}

let isContactSubmitting = false;

async function handleContactSubmit(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  }

  // Prevent duplicate concurrent / double submissions
  if (isContactSubmitting) {
    return false;
  }
  isContactSubmitting = true;

  const form = (e && e.target && e.target.tagName === 'FORM') ? e.target : document.getElementById('contact-form-standalone') || document.getElementById('website-contact-form') || (e && e.target ? e.target.closest('form') : null);
  
  const nameInput = (form && form.querySelector('#contact-name')) || document.getElementById('contact-name');
  const emailInput = (form && form.querySelector('#contact-email')) || document.getElementById('contact-email');
  const phoneInput = (form && form.querySelector('#contact-phone')) || document.getElementById('contact-phone');
  const subjectInput = (form && form.querySelector('#contact-subject')) || document.getElementById('contact-subject');
  const messageInput = (form && form.querySelector('#contact-message')) || document.getElementById('contact-message');
  const submitBtn = (form && form.querySelector('button[type="submit"]')) || document.getElementById('btn-contact-submit');
  const feedbackEl = (form && form.querySelector('#contact-feedback')) || document.getElementById('contact-feedback');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const subject = (subjectInput && subjectInput.value.trim()) ? subjectInput.value.trim() : 'Customer Inquiry';
  const message = messageInput ? messageInput.value.trim() : '';

  // Validation
  if (!name || !email || !message) {
    isContactSubmitting = false;
    const errorMsg = 'Please fill in all required fields (Name, Email, and Message).';
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast(errorMsg, 'error');
    } else {
      alert(errorMsg);
    }
    if (feedbackEl) {
      feedbackEl.className = 'contact-feedback-box error';
      feedbackEl.innerHTML = `⚠️ ${errorMsg}`;
      feedbackEl.style.display = 'block';
    }
    return false;
  }

  // Email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    isContactSubmitting = false;
    const errorMsg = 'Please enter a valid email address.';
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast(errorMsg, 'error');
    } else {
      alert(errorMsg);
    }
    if (feedbackEl) {
      feedbackEl.className = 'contact-feedback-box error';
      feedbackEl.innerHTML = `⚠️ ${errorMsg}`;
      feedbackEl.style.display = 'block';
    }
    return false;
  }

  // Button loading state
  const originalBtnContent = submitBtn ? submitBtn.innerHTML : 'Send Message';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"></path>
      </svg>
      <span>Sending Message...</span>
    `;
  }

  if (feedbackEl) {
    feedbackEl.style.display = 'none';
  }

  const payload = {
    name: name,
    email: email,
    phone: phone,
    subject: subject,
    message: message
  };

  try {
    const result = await sendContactMessageToDatabase(payload);

    // Instant local cache sync for Admin Panel
    try {
      const localMessages = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
      const newMsgObj = {
        id: result.id || ('MSG-' + Date.now()),
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message,
        status: 'unread',
        created_at: new Date().toISOString()
      };
      // Check if not already in local array
      if (!localMessages.some(m => String(m.id) === String(newMsgObj.id))) {
        localMessages.unshift(newMsgObj);
        localStorage.setItem('food_express_messages', JSON.stringify(localMessages));
      }
    } catch (localErr) {
      console.warn('LocalStorage error:', localErr);
    }

    const successMsg = `Thank you, ${name}! Your message has been sent successfully. We will get back to you soon. 🚀`;
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast(successMsg, 'success');
    } else {
      alert(successMsg);
    }

    if (feedbackEl) {
      feedbackEl.className = 'contact-feedback-box success';
      feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Message Sent!</strong> Thank you for reaching out, ${escapeHtml(name)}. Your message is saved and we will contact you shortly via ${escapeHtml(email)}.`;
      feedbackEl.style.display = 'block';
    }

    // Reset form fields
    if (form && typeof form.reset === 'function') {
      form.reset();
    } else {
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (subjectInput) subjectInput.value = '';
      if (messageInput) messageInput.value = '';
    }

  } catch (err) {
    console.error('Failed to submit contact message to database:', err);
    const errorMsg = `Failed to send message: ${err.message || 'Could not reach database server.'}`;
    if (typeof cartManager !== 'undefined' && cartManager.showToast) {
      cartManager.showToast(errorMsg, 'error');
    } else {
      alert(errorMsg);
    }

    if (feedbackEl) {
      feedbackEl.className = 'contact-feedback-box error';
      feedbackEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Submission Failed:</strong> ${escapeHtml(err.message || 'Could not connect to database.')}<br><small style="margin-top:4px; display:block;">Please check that MySQL and Apache are running in your XAMPP Control Panel.</small>`;
      feedbackEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
    setTimeout(() => {
      isContactSubmitting = false;
    }, 1000);
  }

  return false;
}

// Alias for index.html compatibility
async function handleWebsiteContactSubmit(e) {
  return handleContactSubmit(e);
}

// FAQ Accordion Toggle Helper
function toggleFaqItem(btn) {
  if (!btn) return;
  const item = btn.closest('.faq-accordion-item');
  if (!item) return;

  const isCurrentlyActive = item.classList.contains('active');
  
  // Close all other open items in the same accordion
  const parentList = item.closest('.faq-accordion-list');
  if (parentList) {
    const allItems = parentList.querySelectorAll('.faq-accordion-item');
    allItems.forEach(el => {
      if (el !== item) el.classList.remove('active');
    });
  }

  // Toggle selected item
  item.classList.toggle('active', !isCurrentlyActive);
}

// Global Notification System Handler
window.NotificationSystem = {
  notifications: [],

  getNotifStorageKey() {
    try {
      const userJson = localStorage.getItem('food_express_user');
      if (userJson) {
        const u = JSON.parse(userJson);
        if (u && (u.id || u.email)) {
          const identifier = (u.id || u.email).replace(/[^a-zA-Z0-9_-]/g, '_');
          return `food_express_notifications_${identifier}`;
        }
      }
    } catch (e) {}
    return 'food_express_notifications_guest';
  },

  loadNotifications() {
    const key = this.getNotifStorageKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          return arr;
        }
      }
    } catch (e) {}
    return [];
  },

  saveNotifications() {
    const key = this.getNotifStorageKey();
    try {
      localStorage.setItem(key, JSON.stringify(this.notifications));
    } catch (e) {}
  },

  syncForCurrentUser() {
    this.notifications = this.loadNotifications();
    this.render();
  },

  init() {
    this.notifications = this.loadNotifications();
    this.render();
    this.bindEvents();
  },

  toggle() {
    const popover = document.getElementById('notif-popover-card');
    if (!popover) return;
    const isVisible = popover.style.display === 'block';
    popover.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      this.markAllRead();
    }
  },

  bindEvents() {
    const btn = document.getElementById('notif-toggle-btn');
    const popover = document.getElementById('notif-popover-card');
    const clearBtn = document.getElementById('clear-all-notifs');

    document.addEventListener('click', (e) => {
      if (popover && btn && !btn.contains(e.target) && !popover.contains(e.target)) {
        popover.style.display = 'none';
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearAll();
      });
    }
  },

  add(message, type = 'info') {
    this.notifications = this.loadNotifications();
    let icon = 'fa-bell';
    let iconColor = '#3B82F6';
    if (type === 'success' || message.toLowerCase().includes('cart') || message.toLowerCase().includes('added')) {
      icon = 'fa-circle-check';
      iconColor = '#22C55E';
    } else if (type === 'error') {
      icon = 'fa-triangle-exclamation';
      iconColor = '#EF4444';
    }
    
    const newNotif = {
      id: Date.now(),
      message: message,
      type: type,
      icon: icon,
      iconColor: iconColor,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    this.notifications.unshift(newNotif);
    if (this.notifications.length > 20) this.notifications.pop();
    
    this.saveNotifications();
    this.render();

    // Trigger subtle bounce on notification bell
    const btn = document.getElementById('notif-toggle-btn');
    if (btn) {
      btn.style.transform = 'scale(1.25)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 250);
    }
  },

  markAllRead() {
    this.notifications = this.loadNotifications();
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.renderBadge();
  },

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.render();
  },

  renderBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge-count');
    const headerCount = document.getElementById('notif-header-count');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (headerCount) {
      headerCount.textContent = this.notifications.length;
    }
  },

  render() {
    this.renderBadge();
    const container = document.getElementById('notif-list-container');
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div id="notif-empty-state" style="padding:30px 20px; text-align:center; color:#94A3B8;">
          <i class="fa-regular fa-bell-slash" style="font-size:32px; color:#CBD5E1; margin-bottom:8px; display:block;"></i>
          <span style="font-size:13px; font-weight:500;">No new notifications</span>
        </div>`;
      return;
    }

    container.innerHTML = this.notifications.map(n => `
      <div style="padding:10px 16px; border-bottom:1px solid #F8FAFC; display:flex; align-items:flex-start; gap:12px; background:${n.read ? '#FFFFFF' : '#F0F9FF'}; transition:background 0.2s;">
        <div style="font-size:16px; color:${n.iconColor}; margin-top:2px; flex-shrink:0;">
          <i class="fa-solid ${n.icon}"></i>
        </div>
        <div style="flex:1;">
          <p style="margin:0; font-size:13px; color:#1E293B; font-weight:${n.read ? '500' : '600'}; line-height:1.4;">${n.message}</p>
          <span style="font-size:11px; color:#94A3B8; margin-top:3px; display:block;">${n.time}</span>
        </div>
      </div>
    `).join('');
  }
};

// Initialize NotificationSystem immediately if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.NotificationSystem.init());
} else {
  window.NotificationSystem.init();
}
