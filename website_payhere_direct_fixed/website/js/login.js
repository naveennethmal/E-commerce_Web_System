/**
 * FoodExpress Login & Registration Interactive Script
 * Strict authentication: Only registered users can log in.
 * Unregistered users must register first.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authForm = document.getElementById('auth-form');
  const cardTitle = document.getElementById('card-title');
  const cardSubtitle = document.getElementById('card-subtitle');
  const btnSubmit = document.getElementById('btn-submit');
  const btnSubmitText = document.getElementById('btn-submit-text');
  const toggleAuthLink = document.getElementById('toggle-auth-mode');
  const footerPromptText = document.getElementById('footer-prompt-text');
  
  // Register specific elements
  const groupName = document.getElementById('group-name');
  const groupPhone = document.getElementById('group-phone');
  const groupAddress = document.getElementById('group-address');
  const groupConfirmPass = document.getElementById('group-confirm-pass');
  
  // Password eyes
  const togglePassBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password-input');
  const toggleConfirmPassBtn = document.getElementById('toggle-confirm-password');
  const confirmPassInput = document.getElementById('confirm-password-input');
  
  // Role cards
  const roleCustomerCard = document.getElementById('role-customer-card');
  const roleAdminCard = document.getElementById('role-admin-card');
  const selectedRoleInput = document.getElementById('selected-role-input');
  
  
  // Current Auth Mode: 'login' or 'register'
  let currentMode = 'login';
  
  // Role selection state: 'customer' or 'admin'
  let currentRole = 'customer';

  // Seed default registered users into client storage if none exist
  function initRegisteredUsers() {
    const existing = localStorage.getItem('food_express_registered_users');
    if (!existing) {
      const defaultUsers = [
        {
          name: 'Food Express Customer',
          email: 'customer@foodexpress.com',
          password: 'password123',
          role: 'customer'
        },
        {
          name: 'Admin Manager',
          email: 'admin@foodexpress.com',
          password: 'admin123',
          role: 'admin'
        }
      ];
      localStorage.setItem('food_express_registered_users', JSON.stringify(defaultUsers));
    }
  }
  initRegisteredUsers();

  function getRegisteredUsers() {
    try {
      const users = JSON.parse(localStorage.getItem('food_express_registered_users') || '[]');
      return Array.isArray(users) ? users : [];
    } catch (_) {
      return [];
    }
  }

  function addRegisteredUser(user) {
    const users = getRegisteredUsers();
    const email = user.email.toLowerCase().trim();
    const idx = users.findIndex(u => u.email.toLowerCase().trim() === email);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('food_express_registered_users', JSON.stringify(users));
  }

  // Toggle Password Visibility
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePassBtn.innerHTML = isPassword 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  if (toggleConfirmPassBtn && confirmPassInput) {
    toggleConfirmPassBtn.addEventListener('click', () => {
      const isPassword = confirmPassInput.getAttribute('type') === 'password';
      confirmPassInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleConfirmPassBtn.innerHTML = isPassword 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Handle Role Selection
  function selectRole(role) {
    currentRole = role;
    if (selectedRoleInput) selectedRoleInput.value = role;

    if (role === 'customer') {
      roleCustomerCard?.classList.add('active-customer');
      roleAdminCard?.classList.remove('active-admin');
    } else {
      roleCustomerCard?.classList.remove('active-customer');
      roleAdminCard?.classList.add('active-admin');
    }
  }

  if (roleCustomerCard) {
    roleCustomerCard.addEventListener('click', () => selectRole('customer'));
  }

  if (roleAdminCard) {
    roleAdminCard.addEventListener('click', () => selectRole('admin'));
  }

  // Toggle Mode (Login <-> Register)
  function switchMode(mode, prefillEmail = '') {
    currentMode = mode;
    
    if (currentMode === 'register') {
      cardTitle.textContent = 'Create Account';
      cardSubtitle.textContent = 'Register here to create an account & log in';
      btnSubmitText.textContent = 'Register & Log In';
      
      if (groupName) groupName.style.display = 'flex';
      if (groupPhone) groupPhone.style.display = 'flex';
      if (groupAddress) groupAddress.style.display = 'flex';
      if (groupConfirmPass) groupConfirmPass.style.display = 'flex';
      
      if (footerPromptText) footerPromptText.textContent = "Already have an account?";
      if (toggleAuthLink) toggleAuthLink.textContent = "Login Here";
      
      const emailInput = document.getElementById('email-input');
      if (emailInput && prefillEmail) {
        emailInput.value = prefillEmail;
      }
      
    } else {
      cardTitle.textContent = 'Welcome Back!';
      cardSubtitle.textContent = 'Only registered users can log in';
      btnSubmitText.textContent = 'Login';
      
      if (groupName) groupName.style.display = 'none';
      if (groupPhone) groupPhone.style.display = 'none';
      if (groupAddress) groupAddress.style.display = 'none';
      if (groupConfirmPass) groupConfirmPass.style.display = 'none';
      
      if (footerPromptText) footerPromptText.textContent = "Don't have an account yet?";
      if (toggleAuthLink) toggleAuthLink.textContent = "Register Here";
      
      const emailInput = document.getElementById('email-input');
      if (emailInput && prefillEmail) {
        emailInput.value = prefillEmail;
      }
      
      selectRole(currentRole);
    }
  }

  if (toggleAuthLink) {
    toggleAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode(currentMode === 'login' ? 'register' : 'login');
    });
  }


  // Form Submit Handler
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email-input').value.trim().toLowerCase();
      const password = document.getElementById('password-input').value;
      const name = document.getElementById('name-input')?.value.trim() || '';
      const phone = document.getElementById('phone-input')?.value.trim() || '';
      const address = document.getElementById('address-input')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirm-password-input')?.value || '';

      if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return;
      }

      // ===============================================
      // REGISTER MODE HANDLER
      // ===============================================
      if (currentMode === 'register') {
        if (!name) {
          showToast('Please enter your full name.', 'error');
          document.getElementById('name-input')?.focus();
          return;
        }
        if (password.length < 6) {
          showToast('Password must be at least 6 characters.', 'error');
          document.getElementById('password-input')?.focus();
          return;
        }
        if (password !== confirmPassword) {
          showToast('Passwords do not match. Please re-enter.', 'error');
          document.getElementById('confirm-password-input')?.focus();
          return;
        }

        // UI Loading state
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.8';
        btnSubmitText.textContent = 'Creating Account...';

        try {
          const apiPrefix = window.location.pathname.includes('/pages/') ? '../api/' : 'api/';
          const pagePrefix = window.location.pathname.includes('/pages/') ? '../' : '';

          // Send registration request to API
          const response = await fetch(`${apiPrefix}auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name,
              email: email,
              phone: phone,
              address: address,
              password: password,
              role: currentRole
            })
          });

          const data = await response.json();

          if (response.ok && data.status === 'success') {
            // Save to local registry and active session
            const userObj = {
              id: data.user?.id || 'usr_' + Date.now(),
              name: name,
              email: email,
              phone: phone,
              address: address,
              password: password,
              role: currentRole
            };
            addRegisteredUser(userObj);
            localStorage.setItem('food_express_user', JSON.stringify({
              id: userObj.id,
              name: userObj.name,
              email: userObj.email,
              phone: userObj.phone,
              address: userObj.address,
              role: userObj.role
            }));

            showToast(`🎉 Account created successfully! Welcome, ${name}!`, 'success');

            const targetUrl = (currentRole === 'admin') ? `${pagePrefix}admin/index.html` : `${pagePrefix}index.html`;
            setTimeout(() => {
              window.location.href = targetUrl;
            }, 1100);
          } else if (response.status === 409 || (data.message && data.message.includes('already exists'))) {
            // Account already registered
            showToast('⚠️ An account with this email already exists. Please login instead.', 'error');
            setTimeout(() => {
              switchMode('login', email);
            }, 1400);
          } else {
            throw new Error(data.message || 'Registration failed.');
          }
        } catch (err) {
          console.warn('Backend API connection notice:', err.message);
          
          const pagePrefix = window.location.pathname.includes('/pages/') ? '../' : '';

          // Check client storage duplicate
          const registeredUsers = getRegisteredUsers();
          const existing = registeredUsers.find(u => u.email.toLowerCase().trim() === email);
          if (existing) {
            showToast('⚠️ An account with this email already exists. Please login instead.', 'error');
            setTimeout(() => {
              switchMode('login', email);
            }, 1400);
            return;
          }

          // Register in client storage
          const newUser = {
            id: 'usr_' + Date.now(),
            name: name,
            email: email,
            phone: phone,
            address: address,
            password: password,
            role: currentRole
          };
          addRegisteredUser(newUser);
          localStorage.setItem('food_express_user', JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address,
            role: newUser.role
          }));

          showToast(`🎉 Account created successfully! Welcome, ${name}!`, 'success');
          const targetUrl = (currentRole === 'admin') ? `${pagePrefix}admin/index.html` : `${pagePrefix}index.html`;
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 1100);
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.style.opacity = '1';
          btnSubmitText.textContent = 'Register & Log In';
        }
        return;
      }

      // ===============================================
      // LOGIN MODE HANDLER - STRICT AUTHENTICATION
      // ===============================================
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = '0.8';
      btnSubmitText.textContent = 'Verifying Account...';

      try {
        const apiPrefix = window.location.pathname.includes('/pages/') ? '../api/' : 'api/';
        const pagePrefix = window.location.pathname.includes('/pages/') ? '../' : '';

        const response = await fetch(`${apiPrefix}auth.php?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: password,
            role: currentRole
          })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          // Authentication successful
          localStorage.setItem('food_express_user', JSON.stringify(data.user));
          showToast(`Welcome back, ${data.user.name}! Signing in...`, 'success');
          
          const targetUrl = (data.user?.role === 'admin' || currentRole === 'admin') ? `${pagePrefix}admin/index.html` : `${pagePrefix}index.html`;
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 1000);
          return;
        }

        // Handle specific rejection codes from backend
        if (response.status === 404 || data.error_code === 'ACCOUNT_NOT_FOUND' || (data.message && data.message.includes('No account found'))) {
          // Strictly reject login for users not in the users table
          showToast('⚠️ No account found for this email in the database. Please click "Register Here" below to sign up first.', 'error');
          highlightRegisterLink();
          return;
        }

        if (response.status === 401 || data.error_code === 'INVALID_PASSWORD' || (data.message && data.message.includes('Incorrect password'))) {
          showToast('⚠️ Incorrect password. Please check your password and try again.', 'error');
          return;
        }

        throw new Error(data.message || 'Login failed.');

      } catch (err) {
        console.warn('Authentication error:', err.message);
        showToast('⚠️ Authentication error: Only registered users in the database can log in.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmitText.textContent = currentMode === 'login' ? 'Login' : 'Register & Log In';
      }
    });
  }

  // Highlight Register Link helper
  function highlightRegisterLink() {
    if (toggleAuthLink) {
      toggleAuthLink.style.transition = 'all 0.3s ease';
      toggleAuthLink.style.color = '#EA580C';
      toggleAuthLink.style.fontWeight = '800';
      toggleAuthLink.style.fontSize = '15px';
      setTimeout(() => {
        toggleAuthLink.style.fontSize = '';
      }, 1500);
    }
  }

  // Toast System
  function showToast(message, type = 'info') {
    let container = document.querySelector('.auth-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'auth-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `auth-toast ${type}`;
    
    let icon = '<i class="fa-solid fa-bell"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color:#22C55E;"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation" style="color:#EF4444;"></i>';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
