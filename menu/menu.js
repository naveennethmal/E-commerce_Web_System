/**
 * Food Express - Menu Page Logic (menu.js)
 */

(function () {
  let menuProducts = [];
  let menuCategories = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let activeSort = 'popular';
  let filterSpicyOnly = false;
  let filterDiscountOnly = false;

  document.addEventListener('DOMContentLoaded', () => {
    initMenuPage();
  });

  // Global entry point called by router.js or direct navigation
  window.renderMenuPage = function () {
    initMenuPage();
  };

  async function initMenuPage() {
    setupEventListeners();
    await fetchCategories();
    await fetchProducts();
    applyFiltersAndRender();
  }

  function setupEventListeners() {
    const searchInput = document.getElementById('menu-search-input');
    const clearBtn = document.getElementById('menu-search-clear');
    const sortSelect = document.getElementById('menu-sort-select');

    if (searchInput) {
      searchInput.value = searchQuery;
      searchInput.removeEventListener('input', handleSearchInput);
      searchInput.addEventListener('input', handleSearchInput);
    }

    if (clearBtn) {
      clearBtn.removeEventListener('click', clearSearch);
      clearBtn.addEventListener('click', clearSearch);
    }

    if (sortSelect) {
      sortSelect.value = activeSort;
      sortSelect.removeEventListener('change', handleSortChange);
      sortSelect.addEventListener('change', handleSortChange);
    }
  }

  function handleSearchInput(e) {
    searchQuery = e.target.value.trim().toLowerCase();
    const clearBtn = document.getElementById('menu-search-clear');
    if (clearBtn) {
      clearBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
    }
    applyFiltersAndRender();
  }

  function clearSearch() {
    searchQuery = '';
    const searchInput = document.getElementById('menu-search-input');
    const clearBtn = document.getElementById('menu-search-clear');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    applyFiltersAndRender();
  }

  function handleSortChange(e) {
    activeSort = e.target.value;
    applyFiltersAndRender();
  }

  window.toggleSpicyFilter = function () {
    filterSpicyOnly = !filterSpicyOnly;
    const btn = document.getElementById('filter-spicy-toggle');
    if (btn) {
      btn.classList.toggle('active', filterSpicyOnly);
    }
    applyFiltersAndRender();
  };

  window.toggleDiscountFilter = function () {
    filterDiscountOnly = !filterDiscountOnly;
    const btn = document.getElementById('filter-discount-toggle');
    if (btn) {
      btn.classList.toggle('active', filterDiscountOnly);
    }
    applyFiltersAndRender();
  };

  window.selectMenuCategory = function (categoryId, element = null) {
    activeCategory = categoryId.toLowerCase();
    
    // Update active class on category pills
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => pill.classList.remove('active'));
    if (element) {
      element.classList.add('active');
    } else {
      pills.forEach(pill => {
        const onclickAttr = pill.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${categoryId}'`)) {
          pill.classList.add('active');
        }
      });
    }

    applyFiltersAndRender();
  };

  const DEFAULT_CATEGORIES = [
    { id: 'burgers', name: 'Burgers', icon: '🍔' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'chicken', name: 'Fried Chicken', icon: '🍗' },
    { id: 'drinks', name: 'Drinks & Beverages', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🧁' }
  ];

  const DEFAULT_PRODUCTS = [
    {
      id: 'classic-double-cheeseburger',
      name: 'Classic Double Cheeseburger',
      category: 'burgers',
      category_id: 'burgers',
      description: 'Two juicy Angus beef patties, melted cheddar cheese, fresh lettuce, pickles, tomatoes, and house sauce on a toasted brioche bun.',
      price: 9.99,
      originalPrice: 11.99,
      rating: 4.9,
      reviewsCount: 140,
      spicyLevel: 0,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    },
    {
      id: 'pepperoni-supreme-pizza',
      name: 'Pepperoni Supreme Pizza',
      category: 'pizza',
      category_id: 'pizza',
      description: 'Artisanal hand-tossed crust with loaded spicy pepperoni, whole milk mozzarella, and rich tomato marinara sauce.',
      price: 14.99,
      originalPrice: 17.50,
      rating: 4.9,
      reviewsCount: 210,
      spicyLevel: 1,
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    },
    {
      id: 'crispy-chicken-bucket',
      name: 'Crispy Fried Chicken Bucket',
      category: 'chicken',
      category_id: 'chicken',
      description: '8 pieces of golden crispy fried chicken seasoned with our secret blend of 11 herbs and spices.',
      price: 13.99,
      originalPrice: 16.99,
      rating: 4.9,
      reviewsCount: 240,
      spicyLevel: 1,
      image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    },
    {
      id: 'caramel-iced-latte',
      name: 'Creamy Caramel Iced Latte',
      category: 'drinks',
      category_id: 'drinks',
      description: 'Rich espresso combined with chilled whole milk, sweet caramel syrup, and a fluffy whipped cream crown.',
      price: 4.99,
      originalPrice: 5.99,
      rating: 4.8,
      reviewsCount: 180,
      spicyLevel: 0,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    },
    {
      id: 'chocolate-lava-cake',
      name: 'Triple Chocolate Lava Cake',
      category: 'desserts',
      category_id: 'desserts',
      description: 'Decadent dark chocolate cake with a molten warm chocolate center, served with vanilla ice cream.',
      price: 6.99,
      originalPrice: 8.50,
      rating: 4.9,
      reviewsCount: 190,
      spicyLevel: 0,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      isFeatured: true
    }
  ];

  async function fetchCategories() {
    if (window.APP_DATA && Array.isArray(window.APP_DATA.categories) && window.APP_DATA.categories.length > 0) {
      menuCategories = window.APP_DATA.categories;
    } else if (typeof FOOD_CATEGORIES !== 'undefined' && Array.isArray(FOOD_CATEGORIES) && FOOD_CATEGORIES.length > 0) {
      menuCategories = FOOD_CATEGORIES;
    } else {
      menuCategories = DEFAULT_CATEGORIES;
    }
    renderCategoryPills(menuCategories);
  }

  function renderCategoryPills(categories) {
    const container = document.getElementById('menu-categories-list');
    if (!container) return;

    let html = `
      <button class="category-pill ${activeCategory === 'all' ? 'active' : ''}" onclick="selectMenuCategory('all', this)">
        <span class="category-icon">🍽️</span>
        <span class="category-label">All Items</span>
      </button>
    `;

    categories.forEach(cat => {
      const catId = (cat.id || '').toLowerCase();
      if (catId === 'all') return;
      const icon = cat.icon || getCategoryEmoji(catId);
      const isActive = activeCategory === catId ? 'active' : '';
      html += `
        <button class="category-pill ${isActive}" onclick="selectMenuCategory('${catId}', this)">
          <span class="category-icon">${icon}</span>
          <span class="category-label">${cat.name}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  }

  function getCategoryEmoji(catId) {
    const map = {
      burgers: '🍔',
      pizza: '🍕',
      chicken: '🍗',
      drinks: '🥤',
      desserts: '🧁'
    };
    return map[catId] || '🍴';
  }

  async function fetchProducts() {
    if (window.APP_DATA && Array.isArray(window.APP_DATA.products) && window.APP_DATA.products.length > 0) {
      menuProducts = window.APP_DATA.products;
    } else if (typeof FOOD_ITEMS !== 'undefined' && Array.isArray(FOOD_ITEMS) && FOOD_ITEMS.length > 0) {
      menuProducts = FOOD_ITEMS;
    } else {
      menuProducts = DEFAULT_PRODUCTS;
    }
  }

  function applyFiltersAndRender() {
    let filtered = [...menuProducts];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCat = (item.category || item.category_id || '').toLowerCase();
        return itemCat === activeCategory;
      });
    }

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return name.includes(searchQuery) || desc.includes(searchQuery);
      });
    }

    // Spicy filter
    if (filterSpicyOnly) {
      filtered = filtered.filter(item => (item.spicyLevel || item.spicy_level || 0) > 0);
    }

    // Discount filter
    if (filterDiscountOnly) {
      filtered = filtered.filter(item => {
        const price = parseFloat(item.price || 0);
        const orig = parseFloat(item.originalPrice || item.original_price || 0);
        return orig > price;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      if (activeSort === 'rating-desc') {
        return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
      }
      if (activeSort === 'price-asc') {
        return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      }
      if (activeSort === 'price-desc') {
        return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      }
      if (activeSort === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      // Default: Popular / Featured first
      const aFeat = a.isFeatured || a.is_featured || a.isPopular ? 1 : 0;
      const bFeat = b.isFeatured || b.is_featured || b.isPopular ? 1 : 0;
      return bFeat - aFeat;
    });

    renderProductsGrid(filtered);
    updateStatusBar(filtered.length);
  }

  function updateStatusBar(count) {
    const counterEl = document.getElementById('menu-results-count');
    if (counterEl) {
      counterEl.innerHTML = `Showing <strong>${count}</strong> delicious option${count === 1 ? '' : 's'}`;
    }

    const chipsEl = document.getElementById('active-filter-chips');
    if (chipsEl) {
      let chipsHtml = '';
      if (activeCategory !== 'all') {
        chipsHtml += `<span class="filter-chip">${escapeHtml(activeCategory)} <button onclick="selectMenuCategory('all')">&times;</button></span>`;
      }
      if (searchQuery) {
        chipsHtml += `<span class="filter-chip">"${escapeHtml(searchQuery)}" <button onclick="clearSearch()">&times;</button></span>`;
      }
      if (filterSpicyOnly) {
        chipsHtml += `<span class="filter-chip">🌶️ Spicy <button onclick="toggleSpicyFilter()">&times;</button></span>`;
      }
      if (filterDiscountOnly) {
        chipsHtml += `<span class="filter-chip">🏷️ Deals <button onclick="toggleDiscountFilter()">&times;</button></span>`;
      }
      chipsEl.innerHTML = chipsHtml;
    }
  }

  function renderProductsGrid(items) {
    const grid = document.getElementById('menu-foods-grid');
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fa-solid fa-utensils"></i>
          <h3>No Menu Items Found</h3>
          <p>Try searching for something else or clearing active filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(item => {
      const price = parseFloat(item.price || 0);
      const origPrice = parseFloat(item.originalPrice || item.original_price || 0);
      const hasDiscount = origPrice > price;
      const isSpicy = (item.spicyLevel || item.spicy_level || 0) > 0;
      const isFeatured = item.isFeatured || item.is_featured || item.isPopular;
      const img = item.image || item.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

      return `
        <div class="food-card">
          <div class="food-card-img-wrap">
            <img src="${img}" alt="${escapeHtml(item.name)}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'" />
            <div class="food-card-badges">
              ${isFeatured ? '<span class="badge-tag badge-featured">Popular</span>' : ''}
              ${isSpicy ? '<span class="badge-tag badge-spicy">🌶️ Spicy</span>' : ''}
              ${hasDiscount ? '<span class="badge-tag badge-discount">Offer</span>' : ''}
            </div>
          </div>
          <div class="food-card-content">
            <div class="food-card-header">
              <h3 class="food-card-title">${escapeHtml(item.name)}</h3>
              <span class="rating-badge"><i class="fa-solid fa-star"></i> ${item.rating || '4.8'}</span>
            </div>
            <p class="food-card-desc">${escapeHtml(item.description || 'Delicious meal crafted with fresh quality ingredients.')}</p>
            <div class="food-card-footer">
              <div class="price-wrap">
                <span class="food-card-price">$${price.toFixed(2)}</span>
                ${hasDiscount ? `<span class="food-card-price-original">$${origPrice.toFixed(2)}</span>` : ''}
              </div>
              <div style="display:flex; gap:8px;">
                <button type="button" class="btn-quick-view" title="Quick View" onclick="openMenuProductModal('${item.id}')">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="add-to-cart-btn" onclick="addMenuItemToCart('${item.id}')">
                  <i class="fa-solid fa-plus"></i> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.addMenuItemToCart = function (productId) {
    if (window.CartSystem && typeof window.CartSystem.addItem === 'function') {
      window.CartSystem.addItem(productId);
    } else if (window.cart && typeof window.cart.addItem === 'function') {
      window.cart.addItem(productId);
    } else {
      const item = menuProducts.find(p => String(p.id) === String(productId));
      const title = item ? item.name : `Item #${productId}`;
      alert(`"${title}" added to your cart!`);
    }
  };

  window.openMenuProductModal = function (productId) {
    const item = menuProducts.find(p => String(p.id) === String(productId));
    if (!item) return;

    const modal = document.getElementById('menu-item-modal');
    const contentArea = document.getElementById('modal-content-area');
    if (!modal || !contentArea) return;

    const price = parseFloat(item.price || 0);
    const origPrice = parseFloat(item.originalPrice || item.original_price || 0);
    const img = item.image || item.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

    contentArea.innerHTML = `
      <img src="${img}" class="modal-food-img" alt="${escapeHtml(item.name)}" />
      <div class="modal-food-details">
        <h2 class="modal-food-title">${escapeHtml(item.name)}</h2>
        <div class="modal-food-price-row">
          <span class="modal-food-price">$${price.toFixed(2)}</span>
          ${origPrice > price ? `<span class="food-card-price-original">$${origPrice.toFixed(2)}</span>` : ''}
          <span class="rating-badge"><i class="fa-solid fa-star"></i> ${item.rating || '4.8'} (${item.reviewsCount || item.reviews_count || 45} reviews)</span>
        </div>
        <p class="food-card-desc" style="-webkit-line-clamp:none;">${escapeHtml(item.description || 'Prepared fresh upon order with top quality ingredients and master culinary techniques.')}</p>
        <div class="modal-qty-control">
          <span>Quantity:</span>
          <button type="button" class="qty-btn" onclick="updateModalQty(-1)">-</button>
          <span class="qty-val" id="modal-qty-val">1</span>
          <button type="button" class="qty-btn" onclick="updateModalQty(1)">+</button>
          <button type="button" class="add-to-cart-btn" style="margin-left:auto; padding: 12px 24px;" onclick="addModalItemToCart('${item.id}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  };

  let modalQty = 1;
  window.updateModalQty = function (delta) {
    modalQty = Math.max(1, modalQty + delta);
    const qtyValEl = document.getElementById('modal-qty-val');
    if (qtyValEl) qtyValEl.textContent = modalQty;
  };

  window.addModalItemToCart = function (productId) {
    for (let i = 0; i < modalQty; i++) {
      addMenuItemToCart(productId);
    }
    closeMenuModal();
    modalQty = 1;
  };

  window.closeMenuModal = function (e = null) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('menu-item-modal');
    if (modal) modal.style.display = 'none';
  };

  function escapeHtml(str) {
    if (typeof window.escapeHtml === 'function') {
      return window.escapeHtml(str);
    }
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
})();
