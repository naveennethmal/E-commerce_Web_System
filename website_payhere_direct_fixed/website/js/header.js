/**
 * FoodExpress Shared Header Controller
 * Handles Navigation Header Popovers (Notifications & Profile Dropdown)
 */

function initHeaderPopovers() {
  // 1. Profile Dropdown Popover
  const profileTriggerBtn = document.getElementById('profile-trigger-btn');
  const profilePopoverCard = document.getElementById('profile-popover-card');
  const profileWrapper = document.getElementById('profile-dropdown-wrapper');

  if (profileTriggerBtn && profilePopoverCard && profileWrapper) {
    if (!profileTriggerBtn.dataset.headerBound) {
      profileTriggerBtn.dataset.headerBound = 'true';
      profileTriggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close notif popover if open
        const notifCard = document.getElementById('notif-popover-card');
        if (notifCard) notifCard.style.display = 'none';

        profilePopoverCard.classList.toggle('show');
        profileWrapper.classList.toggle('active');
      });
    }
  }

  // 2. Notification Popover
  const notifToggleBtn = document.getElementById('notif-toggle-btn');
  const notifPopoverCard = document.getElementById('notif-popover-card');

  if (notifToggleBtn && notifPopoverCard) {
    if (!notifToggleBtn.dataset.headerBound) {
      notifToggleBtn.dataset.headerBound = 'true';
      notifToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close profile popover if open
        if (profilePopoverCard) profilePopoverCard.classList.remove('show');
        if (profileWrapper) profileWrapper.classList.remove('active');

        const isHidden = notifPopoverCard.style.display === 'none' || !notifPopoverCard.style.display;
        notifPopoverCard.style.display = isHidden ? 'block' : 'none';
      });
    }
  }

  // 3. Clear all notifications button
  const clearNotifsBtn = document.getElementById('clear-all-notifs');
  if (clearNotifsBtn && !clearNotifsBtn.dataset.headerBound) {
    clearNotifsBtn.dataset.headerBound = 'true';
    clearNotifsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const listContainer = document.getElementById('notif-list-container');
      const badgeCount = document.getElementById('notif-badge-count');
      const headerCount = document.getElementById('notif-header-count');
      if (listContainer) {
        listContainer.innerHTML = `
          <div id="notif-empty-state" style="padding:30px 20px; text-align:center; color:#94A3B8;">
            <i class="fa-regular fa-bell-slash" style="font-size:32px; color:#CBD5E1; margin-bottom:8px; display:block;"></i>
            <span style="font-size:13px; font-weight:500;">No new notifications</span>
          </div>`;
      }
      if (badgeCount) {
        badgeCount.textContent = '0';
        badgeCount.style.display = 'none';
      }
      if (headerCount) headerCount.textContent = '0';
    });
  }

  // 4. Close popovers on click outside
  if (!window._headerGlobalClickBound) {
    window._headerGlobalClickBound = true;
    document.addEventListener('click', (e) => {
      const pWrapper = document.getElementById('profile-dropdown-wrapper');
      const pCard = document.getElementById('profile-popover-card');
      const nCard = document.getElementById('notif-popover-card');

      if (pWrapper && pCard && !pWrapper.contains(e.target)) {
        pCard.classList.remove('show');
        pWrapper.classList.remove('active');
      }
      if (nCard && !e.target.closest('.notif-dropdown-wrapper')) {
        nCard.style.display = 'none';
      }
    });
  }

  // 5. Update popover user details from localStorage & sync notifications
  try {
    const userJson = localStorage.getItem('food_express_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const nameEl = document.getElementById('popover-user-name');
      const emailEl = document.getElementById('popover-user-email');
      if (nameEl && user.name) nameEl.textContent = user.name;
      if (emailEl && user.email) emailEl.textContent = user.email;
    }
    if (window.NotificationSystem && typeof window.NotificationSystem.syncForCurrentUser === 'function') {
      window.NotificationSystem.syncForCurrentUser();
    }
  } catch (_) {}
}

if (typeof window.logoutUser !== 'function') {
  window.logoutUser = function() {
    localStorage.removeItem('food_express_user');
    const pagePrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = pagePrefix + 'login.html';
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderPopovers);
} else {
  initHeaderPopovers();
}
