class CartManager {
  constructor() {
    this.cart = this.loadCart();
    this.appliedDiscount = 0;
    this.appliedCode = null;
  }

  loadCart() {
    const saved = localStorage.getItem('foodexpress_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved cart', e);
      }
    }
    return [...INITIAL_CART];
  }

  saveCart() {
    localStorage.setItem('foodexpress_cart', JSON.stringify(this.cart));
    this.render();
  }

  addItem(itemId, qty = 1) {
    const existingIndex = this.cart.findIndex(item => item.id === itemId);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += qty;
    } else {
      this.cart.push({ id: itemId, quantity: qty });
    }
    this.saveCart();
    this.showToast('Item added to cart!');
  }

  updateQuantity(itemId, delta) {
    const index = this.cart.findIndex(item => item.id === itemId);
    if (index > -1) {
      this.cart[index].quantity += delta;
      if (this.cart[index].quantity <= 0) {
        this.cart.splice(index, 1);
        this.showToast('Item removed from cart');
      }
      this.saveCart();
    }
  }

  removeItem(itemId) {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCart();
    this.showToast('Item removed from cart');
  }

  clearCart() {
    this.cart = [];
    this.appliedDiscount = 0;
    this.appliedCode = null;
    this.saveCart();
  }

  async applyPromoCode(code) {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    if (!cleanCode) return false;

    const subtotal = this.getSubtotal();

    try {
      const res = await fetch(`api/offers.php?action=validate_coupon&code=${encodeURIComponent(cleanCode)}&subtotal=${subtotal}`);
      const data = await res.json();

      if (data.status === 'success' && data.offer) {
        const offer = data.offer;
        this.appliedCode = offer.code;
        this.appliedOffer = offer;
        
        if (offer.discount_type === 'percentage') {
          this.appliedDiscount = offer.discount_value / 100;
          this.showToast(`Promo ${offer.code} applied! ${offer.discount_value}% discount added.`);
        } else if (offer.discount_type === 'fixed') {
          this.appliedDiscount = (subtotal > 0) ? (offer.discount_amount / subtotal) : 0;
          this.showToast(`Promo ${offer.code} applied! Rs. ${offer.discount_value} OFF.`);
        } else if (offer.discount_type === 'free_delivery') {
          this.appliedDiscount = 0;
          this.showToast(`Promo ${offer.code} applied! Free Delivery unlocked.`);
        }
        this.render();
        return true;
      } else {
        this.showToast(data.message || 'Invalid promo code', 'error');
        return false;
      }
    } catch (err) {
      if (cleanCode === 'FREE15') {
        this.showToast('Promo FREE15 applied: Free Delivery!');
        this.appliedCode = 'FREE15';
        this.render();
        return true;
      } else if (cleanCode === 'BURGER31' || cleanCode === 'SWEET20' || cleanCode === 'PIZZA25') {
        this.appliedDiscount = 0.20;
        this.appliedCode = cleanCode;
        this.showToast(`Promo ${cleanCode} applied! 20% discount added.`);
        this.render();
        return true;
      } else {
        this.showToast('Invalid promo code', 'error');
        return false;
      }
    }
  }

  getCartItems() {
    return this.cart.map(cartItem => {
      const food = FOOD_ITEMS.find(f => f.id === cartItem.id) || {
        id: cartItem.id,
        name: 'Food Item',
        price: 0,
        image: ''
      };
      return {
        ...food,
        quantity: cartItem.quantity,
        total: food.price * cartItem.quantity
      };
    });
  }

  getSubtotal() {
    return this.getCartItems().reduce((sum, item) => sum + item.total, 0);
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getDiscountAmount() {
    const subtotal = this.getSubtotal();
    if (this.appliedDiscount > 0) {
      return Math.min(subtotal, subtotal * this.appliedDiscount);
    }
    return 0;
  }

  getDeliveryFee() {
    if (this.cart.length === 0) return 0;
    if (this.appliedCode === 'FREE15') return 0;
    if (this.appliedOffer && this.appliedOffer.discount_type === 'free_delivery') return 0;
    return 250;
  }

  getTotal() {
    const sub = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const deliveryFee = this.getDeliveryFee();
    return Math.max(0, sub - discount + deliveryFee);
  }

  render() {
    // Update badge count in header
    const badgeEls = document.querySelectorAll('.cart-count-badge');
    const totalCount = this.getCartCount();
    badgeEls.forEach(el => {
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // Update cart sidebar items
    const cartListEl = document.getElementById('cart-sidebar-list');
    const cartTotalEl = document.getElementById('cart-sidebar-total');
    
    if (cartListEl) {
      const items = this.getCartItems();
      if (items.length === 0) {
        cartListEl.innerHTML = `
          <div class="empty-cart-state">
            <div class="empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
            <p>Your cart is empty</p>
            <span class="empty-sub">Explore our menu and add your favorite meals!</span>
          </div>
        `;
      } else {
        cartListEl.innerHTML = items.map(item => `
          <div class="cart-item-card" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
            <div class="cart-item-info">
              <h4 class="cart-item-title">${item.name}</h4>
              <div class="cart-item-price">Rs. ${(parseFloat(item.price) || 0).toFixed(2)}</div>
              <div class="cart-item-controls">
                <button class="cart-qty-btn decrease" onclick="cartManager.updateQuantity('${item.id}', -1)">-</button>
                <span class="cart-qty-num">${item.quantity}</span>
                <button class="cart-qty-btn increase" onclick="cartManager.updateQuantity('${item.id}', 1)">+</button>
              </div>
            </div>
            <button class="cart-remove-btn" onclick="cartManager.removeItem('${item.id}')" title="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `).join('');
      }
    }

    if (cartTotalEl) {
      cartTotalEl.textContent = `Rs. ${this.getTotal().toFixed(2)}`;
    }

    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }

    if (typeof renderCheckoutPage === 'function') {
      renderCheckoutPage();
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (container) {
      container.style.display = 'none';
    }

    if (window.NotificationSystem && typeof window.NotificationSystem.add === 'function') {
      window.NotificationSystem.add(message, type);
    }
  }

  async placeOrder(deliveryDetails = {}, options = {}) {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty!', 'error');
      return null;
    }

    const subtotal = this.getSubtotal();
    const deliveryFee = this.getDeliveryFee();
    const discount = this.getDiscountAmount();
    const total = this.getTotal();

    const payload = {
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      discount: discount,
      promo_code: this.appliedCode || null,
      total: total,
      address: deliveryDetails.address || 'Colombo Delivery Address',
      city: deliveryDetails.city || 'Colombo',
      customer_name: deliveryDetails.name || 'Customer',
      customer_phone: deliveryDetails.phone || '0771234567',
      customer_email: deliveryDetails.email || 'customer@example.com',
      payment_method: deliveryDetails.paymentMethod || 'cash_on_delivery',
      user_id: deliveryDetails.userId || null,
      items: this.getCartItems()
    };

    try {
      const res = await fetch('api/orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (!options.preserveCart) {
          this.clearCart();
          this.showToast(`Order #${data.order_id} sent to Admin panel & database! 🎉`);
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed posting order to API:', err);
    }

    // Do not fake a successful order when the API/database request failed.
    this.showToast('Could not create the order. Please check Apache/MySQL and try again.', 'error');
    return null;
  }
}

const cartManager = new CartManager();

