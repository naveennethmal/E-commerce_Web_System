class Router {
  constructor() {
    this.currentRoute = 'home';
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.handleRoute());
    } else {
      this.handleRoute();
    }
  }

  handleRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    let hash = window.location.hash.replace('#', '');
    if (!hash && urlParams.get('payment') === 'success') {
      hash = 'checkout';
    } else if (!hash) {
      hash = 'home';
    }
    this.navigateTo(hash);
  }

  navigateTo(route) {
    this.currentRoute = route;
    window.location.hash = route;
    this.render();
  }

  render() {
    if (this.currentRoute === 'contact') {
      window.location.href = window.location.pathname.includes('/pages/') ? 'contact.html' : 'pages/contact.html';
      return;
    }
    if (this.currentRoute === 'orders') {
      window.location.href = window.location.pathname.includes('/pages/') ? 'orders.html' : 'pages/orders.html';
      return;
    }
    if (this.currentRoute === 'profile') {
      window.location.href = window.location.pathname.includes('/pages/') ? 'profile.html' : 'pages/profile.html';
      return;
    }
    if (this.currentRoute === 'favorites') {
      window.location.href = window.location.pathname.includes('/pages/') ? 'favorites.html' : 'pages/favorites.html';
      return;
    }
    if (this.currentRoute === 'login') {
      window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
      return;
    }
    if (this.currentRoute === 'admin') {
      window.location.href = window.location.pathname.includes('/admin/') ? 'index.html' : 'admin/index.html';
      return;
    };

    const validRoutes = ['home', 'menu', 'offers', 'about', 'cart', 'checkout'];
    let activeRoute = validRoutes.includes(this.currentRoute) ? this.currentRoute : 'home';

    // Toggle view sections
    validRoutes.forEach(r => {
      const viewEl = document.getElementById(`${r}-view`);
      if (viewEl) {
        if (r === activeRoute) {
          viewEl.classList.add('active');
          viewEl.style.display = 'block';
        } else {
          viewEl.classList.remove('active');
          viewEl.style.display = 'none';
        }
      }
    });

    // Update active state in nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const targetRoute = link.getAttribute('data-route');
      if (targetRoute === activeRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update body & layout container classes for route-based CSS styling
    if (document.body) {
      document.body.setAttribute('data-active-route', activeRoute);
      document.body.classList.remove('route-home', 'route-menu', 'route-offers', 'route-about', 'route-cart', 'route-checkout');
      document.body.classList.add(`route-${activeRoute}`);
    }

    const mainLayout = document.querySelector('.main-content-layout');
    if (mainLayout) {
      if (activeRoute === 'cart' || activeRoute === 'about' || activeRoute === 'checkout') {
        mainLayout.classList.add('hide-cart-sidebar');
      } else {
        mainLayout.classList.remove('hide-cart-sidebar');
      }
    }

    // Show / Hide persistent Cart Sidebar depending on active route (Hidden on Cart, About, Checkout)
    const cartSidebar = document.getElementById('cart-sidebar');
    if (cartSidebar) {
      if (activeRoute === 'cart' || activeRoute === 'about' || activeRoute === 'checkout') {
        cartSidebar.style.setProperty('display', 'none', 'important');
      } else {
        cartSidebar.style.removeProperty('display');
        cartSidebar.style.display = 'flex';
      }
    }

    if (activeRoute === 'menu' && typeof renderMenuPage === 'function') {
      renderMenuPage();
    }

    if ((activeRoute === 'offers' || activeRoute === 'home') && typeof renderOffersPage === 'function') {
      renderOffersPage();
    }

    if (activeRoute === 'checkout' && typeof renderCheckoutPage === 'function') {
      renderCheckoutPage();
    }

    // Scroll to top when view changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

const router = new Router();
