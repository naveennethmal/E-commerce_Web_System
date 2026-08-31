document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

let homeCategories = [];
let homeProducts = [];

async function initHomePage() {
  await loadHomeCategories();
  await loadHomeFeaturedProducts();
}

async function loadHomeCategories() {
  const categoriesListEl = document.getElementById('home-categories-list');
  if (!categoriesListEl) return;

  try {
    const response = await fetch('../api/categories.php');
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        homeCategories = result.data;
      }
    }
  } catch (err) {
    console.warn('Backend categories API unavailable, using fallback data:', err);
  }

  if (!homeCategories.length && window.APP_DATA && window.APP_DATA.categories) {
    homeCategories = window.APP_DATA.categories;
  }

  renderHomeCategories(homeCategories);
}

function renderHomeCategories(categories) {
  const container = document.getElementById('home-categories-list');
  if (!container) return;

  if (!categories || categories.length === 0) {
    container.innerHTML = '<p class="text-muted">No categories available.</p>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="category-card" onclick="filterHomeCategory('${cat.id}')">
      <div class="category-icon-wrap">
        <span class="category-emoji">${cat.icon || '🍔'}</span>
      </div>
      <span class="category-name">${cat.name}</span>
    </div>
  `).join('');
}

async function loadHomeFeaturedProducts() {
  const gridEl = document.getElementById('featured-foods-grid');
  if (!gridEl) return;

  try {
    const response = await fetch('../api/products.php?featured=1');
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        homeProducts = result.data;
      }
    }
  } catch (err) {
    console.warn('Backend products API unavailable, using fallback data:', err);
  }

  if (!homeProducts.length && window.APP_DATA && window.APP_DATA.products) {
    homeProducts = window.APP_DATA.products.filter(p => p.isFeatured || p.isPopular);
  }

  renderHomeFeaturedProducts('all');
}

function filterHomeCategory(categoryKey, tabBtn = null) {
  if (tabBtn) {
    const tabs = document.querySelectorAll('#home-filter-tabs .filter-tab-pill');
    tabs.forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');
  }
  renderHomeFeaturedProducts(categoryKey);
}

function renderHomeFeaturedProducts(categoryKey = 'all') {
  const grid = document.getElementById('featured-foods-grid');
  if (!grid) return;

  let filtered = homeProducts;
  if (categoryKey !== 'all') {
    filtered = homeProducts.filter(item => 
      (item.category && item.category.toLowerCase() === categoryKey.toLowerCase()) ||
      (item.category_id && item.category_id.toLowerCase() === categoryKey.toLowerCase())
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results"><p>No featured items found in this category.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="food-card">
      <div class="food-card-img-wrap">
        <img src="${item.image || item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'" />
        ${item.isFeatured ? '<span class="badge-featured">Featured</span>' : ''}
      </div>
      <div class="food-card-content">
        <div class="food-card-header">
          <h3 class="food-card-title">${item.name}</h3>
          <span class="rating-badge"><i class="fa-solid fa-star"></i> ${item.rating || '4.8'}</span>
        </div>
        <p class="food-card-desc">${item.description || 'Delicious food item prepared fresh.'}</p>
        <div class="food-card-footer">
          <span class="food-card-price">$${parseFloat(item.price).toFixed(2)}</span>
          <button class="add-to-cart-btn" onclick="addHomeItemToCart(${item.id})">
            <i class="fa-solid fa-plus"></i> Add
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function addHomeItemToCart(productId) {
  if (window.CartSystem && typeof window.CartSystem.addItem === 'function') {
    window.CartSystem.addItem(productId);
  } else if (window.cart && typeof window.cart.addItem === 'function') {
    window.cart.addItem(productId);
  } else {
    alert(`Item #${productId} added to cart!`);
  }
}

function handleHeroCtaClick() {
  if (window.router) {
    window.router.navigateTo('menu');
  } else {
    window.location.href = '../index.html#menu';
  }
}

function switchHomeSlide(slideIndex) {
  const dots = document.querySelectorAll('.home-carousel-dots .dot');
  dots.forEach((dot, idx) => {
    if (idx === slideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}
