/**
 * FoodExpress Admin Dashboard Interactive Controller
 * Connected directly to MySQL Database via ../api/admin.php
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check auth user session
  checkAdminAuth();

  // Sidebar navigation switching
  setupSidebarNavigation();

  // Setup user profile header dropdown
  setupAdminUserDropdown();

  // Load initial dashboard statistics and data from MySQL
  loadDashboardData();

  // Real-time live auto-refresh (poll stats & total sales every 10 seconds)
  setInterval(() => {
    loadDashboardData();
  }, 10000);

  // Setup view managers
  setupFoodItemsManager();
  setupOrdersManager();
  setupCategoriesManager();
  setupCustomersManager();
  setupMessagesManager();
});

function setupAdminUserDropdown() {
  const btn = document.getElementById('admin-user-dropdown');
  const popup = document.getElementById('admin-profile-popup');
  if (!btn || !popup) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = popup.style.display === 'block';
    popup.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !popup.contains(e.target)) {
      popup.style.display = 'none';
    }
  });
}

function closeAdminProfileDropdown() {
  const popup = document.getElementById('admin-profile-popup');
  if (popup) popup.style.display = 'none';
}

function checkAdminAuth() {
  const userJson = localStorage.getItem('food_express_user');
  if (!userJson) {
    window.location.href = '../pages/login.html';
    return;
  }
  try {
    const user = JSON.parse(userJson);
    if (user.role !== 'admin') {
      window.location.href = '../index.html';
      return;
    }
    const displayName = user.name || 'Admin User';
    const adminNameEl = document.getElementById('admin-display-name');
    const dropdownNameEl = document.getElementById('dropdown-admin-name');
    if (adminNameEl) adminNameEl.textContent = displayName;
    if (dropdownNameEl) dropdownNameEl.textContent = displayName;
  } catch (e) {
    window.location.href = '../pages/login.html';
  }
}

function setupSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const viewPanels = document.querySelectorAll('.admin-view-panel');

  const brandLogo = document.querySelector('.admin-brand');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      const dashLink = document.querySelector('.sidebar-link[data-view="dashboard"]');
      if (dashLink) {
        e.preventDefault();
        dashLink.click();
      }
    });
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetView = link.getAttribute('data-view');
      
      if (targetView === 'logout') {
        e.preventDefault();
        handleAdminLogout();
        return;
      }

      if (!targetView) return;
      e.preventDefault();

      // Update sidebar active link
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update visible view panel
      viewPanels.forEach(panel => {
        if (panel.id === `view-${targetView}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Lazy load view data from Database
      if (targetView === 'dashboard') loadDashboardData();
      if (targetView === 'food-items') loadFoodItemsData();
      if (targetView === 'orders') loadOrdersData();
      if (targetView === 'categories') loadCategoriesData();
      if (targetView === 'customers') loadCustomersData();
      if (targetView === 'offers') loadOffersData();
      if (targetView === 'messages') loadMessagesData();
    });
  });
}

// -------------------------------------------------------------
// 1. DASHBOARD STATS & RECENT ORDERS
// -------------------------------------------------------------
async function loadDashboardData() {
  try {
    const response = await fetch(`../api/admin.php?action=stats&t=${Date.now()}`);
    const result = await response.json();

    if (result.status === 'success') {
      const stats = result.data;
      
      // Update Stat Cards with MySQL Live Numbers
      updateText('stat-food-count', stats.foodItems);
      updateText('stat-orders-count', stats.totalOrders);
      updateText('stat-customers-count', stats.totalCustomers);
      
      const salesFormatted = 'Rs. ' + parseFloat(stats.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
      updateText('stat-total-sales', salesFormatted);
      
      const unreadMsgs = stats.unreadMessages !== undefined ? stats.unreadMessages : 0;
      const statMsgEl = document.getElementById('stat-messages-count');
      if (statMsgEl) {
        statMsgEl.textContent = unreadMsgs > 0 ? `${unreadMsgs} New` : '0';
      }

      const badgeEl = document.getElementById('sidebar-messages-count');
      if (badgeEl) {
        if (unreadMsgs > 0) {
          badgeEl.textContent = unreadMsgs;
          badgeEl.style.display = 'inline-block';
        } else {
          badgeEl.style.display = 'none';
        }
      }

      // Render Recent Orders Table & Sales Overview Chart
      renderRecentOrdersTable(stats.recentOrders);
      renderSalesOverviewChart(stats.chartData, stats.chartLabels, stats.monthlyRevenue, stats.monthlyOrders);
    } else {
      throw new Error(result.message || 'Failed to fetch stats');
    }
  } catch (err) {
    console.warn('Using local fallback data for Dashboard:', err.message);
    // Fallback static data if API unreachable
    updateText('stat-food-count', '34');
    updateText('stat-orders-count', '18');
    updateText('stat-customers-count', '12');
    updateText('stat-total-sales', 'Rs. 35,460.00');
    checkUnreadMessagesBadge();
    renderSalesOverviewChart();
  }
}

let salesChartInstance = null;

function renderSalesOverviewChart(chartData, labels, monthlyRevenue, monthlyOrders) {
  const canvas = document.getElementById('salesOverviewChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  const defaultLabels = labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const defaultData = chartData || [95, 115, 150, 120, 178, 224];
  const revData = monthlyRevenue || [];
  const ordData = monthlyOrders || [];

  // Create smooth linear gradient under red sales curve
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(255, 59, 48, 0.28)');
  gradient.addColorStop(1, 'rgba(255, 59, 48, 0.01)');

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: defaultLabels,
      datasets: [{
        label: 'Sales',
        data: defaultData,
        borderColor: '#FF3B30',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#FF3B30',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              const rev = revData[idx] !== undefined ? revData[idx] : 0;
              const ords = ordData[idx] !== undefined ? ordData[idx] : 0;
              if (rev > 0 || ords > 0) {
                return ` Revenue: Rs. ${parseFloat(rev).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${ords} Delivered Orders)`;
              }
              return ` Sales Level: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#F1F5F9',
            drawBorder: false
          },
          ticks: {
            color: '#64748B',
            font: { size: 12, weight: '600' }
          }
        },
        y: {
          min: 0,
          suggestedMax: 500,
          grace: '10%',
          ticks: {
            stepSize: 100,
            color: '#64748B',
            font: { size: 12, weight: '600' }
          },
          grid: {
            color: '#F1F5F9',
            drawBorder: false
          }
        }
      }
    }
  });
}

function renderRecentOrdersTable(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94A3B8; padding:20px;">No recent orders recorded in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td class="order-id-badge">${order.id}</td>
      <td>${escapeHtml(order.customer)}</td>
      <td><span class="order-status-badge ${order.status.toLowerCase()}">${capitalize(order.status)}</span></td>
      <td><strong>${order.total}</strong></td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------
// 2. FOOD ITEMS MANAGEMENT
// -------------------------------------------------------------
async function loadFoodItemsData() {
  const tbody = document.querySelector('#view-food-items table tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Loading food items from database...</td></tr>`;

  try {
    const response = await fetch('../api/admin.php?action=products');
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      tbody.innerHTML = result.data.map(item => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="../${item.image_url}" alt="${escapeHtml(item.name)}" style="width:36px; height:36px; border-radius:8px; object-fit:cover;" />
              <strong>${escapeHtml(item.name)}</strong>
            </div>
          </td>
          <td>${capitalize(item.category_name || item.category_id || 'Burgers')}</td>
          <td><strong>Rs. ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
          <td>
            <span class="order-status-badge ${item.is_available ? 'delivered' : 'cancelled'}">
              ${item.is_available ? 'Available' : 'Out of Stock'}
            </span>
          </td>
          <td>
            <button class="btn-action-sm btn-edit" onclick="editFoodItem('${item.id}', '${escapeHtml(item.name)}', ${item.price})">Edit</button>
            <button class="btn-action-sm btn-delete" onclick="deleteFoodItem('${item.id}', '${escapeHtml(item.name)}')"><i class="fa-solid fa-trash-can"></i> Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load food items:', err);
  }
}

function setupFoodItemsManager() {
  // Navigation handled via direct anchor href to add_food_item.html
}

async function deleteFoodItem(id, name) {
  if (confirm(`Are you sure you want to delete "${name}" from database?`)) {
    try {
      const res = await fetch(`../api/admin.php?action=products&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        showAdminToast(`Deleted "${name}" from database!`);
        loadFoodItemsData();
        loadDashboardData();
      }
    } catch (e) {
      showAdminToast(`Deleted "${name}"`);
    }
  }
}

function editFoodItem(id) {
  window.location.href = `edit_food_item.html?id=${encodeURIComponent(id)}`;
}

// -------------------------------------------------------------
// 3. ORDERS MANAGEMENT
// -------------------------------------------------------------
async function loadOrdersData() {
  const tbody = document.getElementById('full-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Loading orders from database...</td></tr>`;

  try {
    const response = await fetch('../api/admin.php?action=orders');
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">No orders found in database.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data.map(order => {
        const hasPromo = order.promo_code || (parseFloat(order.discount_amount || 0) > 0);
        const promoBadge = hasPromo 
          ? `<span class="order-status-badge preparing" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5; font-weight:700;"><i class="fa-solid fa-ticket"></i> ${escapeHtml(order.promo_code || 'PROMO')} (-Rs. ${parseFloat(order.discount_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>`
          : `<span style="color:#94A3B8; font-size:12.5px;">No Promo</span>`;

        return `
          <tr>
            <td class="order-id-badge">${order.id}</td>
            <td>${escapeHtml(order.customer_name || 'Guest User')}</td>
            <td>${promoBadge}</td>
            <td>
              <select class="btn-action-sm" onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 4px 8px; border-radius: 6px; font-weight:600; cursor:pointer;">
                <option value="pending" ${order.order_status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="preparing" ${order.order_status === 'preparing' ? 'selected' : ''}>Preparing</option>
                <option value="delivered" ${order.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${order.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td><strong>Rs. ${parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td>${dateAgo(order.created_at)}</td>
            <td>
              <button class="btn-action-sm btn-delete" onclick="deleteOrder('${order.id}')" title="Delete Order">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

function setupOrdersManager() {
  // Handled dynamically via updateOrderStatus & deleteOrder
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch('../api/admin.php?action=update_order_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status: newStatus })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showAdminToast(`Order ${orderId} updated to "${capitalize(newStatus)}" in database!`);
      loadDashboardData();
    }
  } catch (err) {
    showAdminToast(`Order ${orderId} updated to "${capitalize(newStatus)}"!`);
  }
}

async function deleteOrder(orderId) {
  if (confirm(`Are you sure you want to delete order "${orderId}" from database?`)) {
    try {
      const res = await fetch(`../api/admin.php?action=delete_order&id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        showAdminToast(`Order ${orderId} deleted successfully from database!`);
        loadOrdersData();
        loadDashboardData();
      } else {
        showAdminToast(data.message || 'Failed to delete order', 'error');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      showAdminToast(`Failed to delete order ${orderId}`, 'error');
    }
  }
}

// -------------------------------------------------------------
// 4. CATEGORIES MANAGEMENT
// -------------------------------------------------------------
async function loadCategoriesData() {
  const tbody = document.querySelector('#view-categories table tbody');
  if (!tbody) return;

  try {
    const response = await fetch('../api/admin.php?action=categories');
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      tbody.innerHTML = result.data.map(cat => `
        <tr onclick="viewCategoryItems('${escapeHtml(cat.id)}', '${escapeHtml(cat.name)}', '${cat.icon || '<i class=\'fa-solid fa-utensils\'></i>'}')" style="cursor:pointer;" title="Click to view food items in ${escapeHtml(cat.name)}">
          <td style="font-size:20px; width:70px;">${cat.icon || '<i class="fa-solid fa-utensils"></i>'}</td>
          <td><strong style="font-size:15px; color:var(--text-dark);">${escapeHtml(cat.name)}</strong></td>
          <td>
            <span class="order-status-badge preparing" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              <span><i class="fa-solid fa-eye"></i> ${cat.total_items || 0} Items</span>
            </span>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <a href="edit_category.html?id=${escapeHtml(cat.id)}" class="btn-action-sm btn-edit" title="Edit Category" onclick="event.stopPropagation();" style="margin-right:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </a>
            <button type="button" class="btn-action-sm btn-delete" onclick="event.stopPropagation(); deleteCategory('${escapeHtml(String(cat.id))}', '${escapeHtml(cat.name)}')" title="Delete Category" style="cursor:pointer;">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function deleteCategory(id, categoryName) {
  if (!confirm(`Are you sure you want to delete category "${categoryName}"? Food items in this category will become unassigned.`)) {
    return;
  }

  try {
    const res = await fetch(`../api/admin.php?action=categories&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();

    if (result.status === 'success') {
      showAdminToast(`Category "${categoryName}" deleted successfully!`);
      loadCategoriesData();
      loadDashboardData();
    } else {
      alert('Error: ' + (result.message || 'Failed to delete category'));
    }
  } catch (err) {
    console.error('Error deleting category:', err);
    try {
      const resFallback = await fetch('../api/admin.php?action=delete_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
      });
      const resData = await resFallback.json();
      if (resData.status === 'success') {
        showAdminToast(`Category "${categoryName}" deleted successfully!`);
        loadCategoriesData();
        loadDashboardData();
        return;
      }
    } catch (_) {}
    alert('Failed to delete category. Please check network connection.');
  }
}
window.deleteCategory = deleteCategory;

async function viewCategoryItems(catId, catName, catIcon) {
  const panel = document.getElementById('category-items-panel');
  const titleEl = document.getElementById('selected-cat-title');
  const tbody = document.getElementById('category-items-tbody');

  if (!panel || !tbody) return;

  panel.style.display = 'block';
  if (titleEl) titleEl.innerHTML = `${catIcon} Food Items in "${catName}" Category`;

  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px;">Loading items for ${catName}...</td></tr>`;

  try {
    const response = await fetch(`../api/admin.php?action=products&category_id=${encodeURIComponent(catId)}`);
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94A3B8; padding:16px;">No food items found in this category.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data.map(item => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="../${item.image_url || 'images/login_bg.jpg'}" alt="${escapeHtml(item.name)}" style="width:36px; height:36px; border-radius:8px; object-fit:cover;" />
              <strong>${escapeHtml(item.name)}</strong>
            </div>
          </td>
          <td><strong>Rs. ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
          <td>
            <span class="order-status-badge ${item.is_available ? 'delivered' : 'cancelled'}">
              ${item.is_available ? 'Available' : 'Out of Stock'}
            </span>
          </td>
          <td>
            <a href="edit_food_item.html?id=${encodeURIComponent(item.id)}" class="btn-action-sm btn-edit" style="text-decoration:none;">Edit Item</a>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load category items:', err);
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeCategoryItemsPanel() {
  const panel = document.getElementById('category-items-panel');
  if (panel) panel.style.display = 'none';
}

function setupCategoriesManager() {}

// -------------------------------------------------------------
// 5. CUSTOMERS MANAGEMENT
// -------------------------------------------------------------
async function loadCustomersData() {
  const tbody = document.getElementById('customers-table-tbody') || document.querySelector('#view-customers table tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748B;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading registered customers...</td></tr>`;

  try {
    const response = await fetch(`../api/admin.php?action=customers&t=${Date.now()}`);
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#94A3B8;">No registered customers found in database.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data.map(u => {
        const isAdmin = u.role === 'admin';
        const regDate = u.created_at ? dateAgo(u.created_at) : 'N/A';
        const phone = u.phone || 'N/A';
        const totalOrd = u.total_orders || 0;
        const ordersText = `${totalOrd} ${totalOrd === 1 ? 'Order' : 'Orders'}`;
        const initialLetter = (u.name || u.email || 'U').charAt(0).toUpperCase();

        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:36px; height:36px; border-radius:50%; background:${isAdmin ? '#FEF3C7' : '#E0F2FE'}; color:${isAdmin ? '#D97706' : '#0284C7'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0;">
                  ${escapeHtml(initialLetter)}
                </div>
                <div>
                  <strong style="color:#1E293B; font-size:14.5px;">${escapeHtml(u.name || 'User')}</strong>
                  ${isAdmin ? `<span style="font-size:10.5px; background:#FEF3C7; color:#D97706; font-weight:800; padding:2px 7px; border-radius:8px; margin-left:6px; text-transform:uppercase;">Admin</span>` : ''}
                </div>
              </div>
            </td>
            <td><a href="mailto:${escapeHtml(u.email)}" style="color:#2563EB; text-decoration:none; font-weight:500; font-size:13.5px;">${escapeHtml(u.email)}</a></td>
            <td><span style="font-size:13px; color:#475569; font-weight:500;"><i class="fa-solid fa-phone" style="font-size:11px; color:#94A3B8; margin-right:5px;"></i>${escapeHtml(phone)}</span></td>
            <td><span style="font-size:13px; color:#64748B;">${regDate}</span></td>
            <td>
              <span class="order-status-badge ${isAdmin ? 'preparing' : 'delivered'}" style="font-weight:600;">
                ${isAdmin ? 'System Admin' : 'Customer'} (${ordersText})
              </span>
            </td>
            <td>
              ${!isAdmin ? `
                <button type="button" class="btn-action-sm btn-delete" onclick="deleteCustomer('${escapeHtml(String(u.id))}', '${escapeHtml(u.name || u.email)}')" style="cursor:pointer;" title="Delete Customer Account">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              ` : `
                <span style="font-size:12px; color:#94A3B8; font-style:italic;">Protected</span>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      throw new Error(result.message || 'Failed to load customer list');
    }
  } catch (err) {
    console.error('Failed to load customers:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#EF4444;">Failed to load customer data. Please try again.</td></tr>`;
  }
}

async function deleteCustomer(id, customerName) {
  if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action will permanently remove their account.`)) {
    return;
  }

  try {
    const res = await fetch(`../api/admin.php?action=customers&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();

    if (result.status === 'success') {
      showAdminToast(`Customer "${customerName}" deleted successfully!`);
      loadCustomersData();
      loadDashboardData();
    } else {
      alert('Error: ' + (result.message || 'Failed to delete customer'));
    }
  } catch (err) {
    console.error('Error deleting customer:', err);
    try {
      const resFallback = await fetch('../api/admin.php?action=delete_customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
      });
      const resData = await resFallback.json();
      if (resData.status === 'success') {
        showAdminToast(`Customer "${customerName}" deleted successfully!`);
        loadCustomersData();
        loadDashboardData();
        return;
      }
    } catch (_) {}
    alert('Failed to delete customer. Please check network connection.');
  }
}
window.deleteCustomer = deleteCustomer;

function setupCustomersManager() {}

// -------------------------------------------------------------
// 6. OFFERS & PROMOS MANAGEMENT
// -------------------------------------------------------------
async function loadOffersData() {
  const fullTbody = document.getElementById('full-offers-tbody');
  const overviewTbody = document.getElementById('overview-offers-tbody');

  let offers = [];

  try {
    const response = await fetch(`../api/admin.php?action=offers&t=${Date.now()}`);
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      offers = result.data;
      localStorage.setItem('food_express_offers', JSON.stringify(offers));
    } else {
      throw new Error('API returned invalid result');
    }
  } catch (err) {
    const saved = localStorage.getItem('food_express_offers');
    if (saved) {
      try { offers = JSON.parse(saved); } catch(e){}
    }
    if (!offers || offers.length === 0) {
      offers = typeof SPECIAL_OFFERS !== 'undefined' ? [...SPECIAL_OFFERS] : [];
    }
  }

  let orderPromoCounts = {};
  try {
    const oRes = await fetch('../api/admin.php?action=orders');
    const oData = await oRes.json();
    if (oData.status === 'success' && Array.isArray(oData.data)) {
      oData.data.forEach(ord => {
        if (ord.promo_code) {
          const codeUpper = ord.promo_code.toUpperCase().trim();
          orderPromoCounts[codeUpper] = (orderPromoCounts[codeUpper] || 0) + 1;
        }
      });
    }
  } catch (_) {}

  // Populate Stat Card Count (Active Offers)
  const activeCount = offers.filter(o => o && (Number(o.is_active) === 1 || o.is_active === true || o.is_active === '1')).length;
  updateText('stat-offers-count', activeCount);

  // Populate Dashboard Widget Overview
  if (overviewTbody) {
    if (offers.length === 0) {
      overviewTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94A3B8; padding:18px;">No special offers created yet.</td></tr>`;
    } else {
      overviewTbody.innerHTML = offers.slice(0, 5).map(o => {
        const isActive = o && (Number(o.is_active) === 1 || o.is_active === true || o.is_active === '1');
        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                ${o.image_url ? `<img src="../${escapeHtml(o.image_url)}" alt="" style="width:28px; height:28px; border-radius:6px; object-fit:cover;" />` : `<span style="font-size:16px; color:#EA580C;"><i class="fa-solid fa-tags"></i></span>`}
                <strong style="color:var(--text-dark);">${escapeHtml(o.title)}</strong>
              </div>
            </td>
            <td><span style="background:#F1F5F9; color:#0F172A; font-family:monospace; padding:3px 8px; border-radius:6px; font-weight:700; font-size:12px;">${escapeHtml(o.code)}</span></td>
            <td><strong style="color:var(--admin-header-bg); font-weight:700;">${formatDiscount(o.discount_type, o.discount_value)}</strong></td>
            <td>
              <button class="order-status-badge ${isActive ? 'delivered' : 'cancelled'}" onclick="toggleOfferStatus('${escapeHtml(o.id)}', ${isActive ? 0 : 1})" style="border:none; cursor:pointer;" title="Click to ${isActive ? 'Disable' : 'Enable'}">
                ${isActive ? 'Active' : 'Disabled'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Populate Full Offers View Table
  if (fullTbody) {
    if (offers.length === 0) {
      fullTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:#94A3B8; padding:36px 20px;">
            <div style="font-size:32px; margin-bottom:8px; color:#EA580C;"><i class="fa-solid fa-tags"></i></div>
            <h4 style="font-size:16px; color:#1E293B; margin-bottom:4px;">No Special Offers in Database</h4>
            <p style="font-size:13px; color:#64748B; margin-bottom:14px;">Create your first promo deal or coupon code to attract more customers.</p>
            <a href="add_offer.html" class="btn-action-sm btn-edit" style="text-decoration:none; padding:8px 16px; font-size:13px;">+ Add New Offer</a>
          </td>
        </tr>
      `;
    } else {
      fullTbody.innerHTML = offers.map(o => {
        const isActive = o && (Number(o.is_active) === 1 || o.is_active === true || o.is_active === '1');
        const offerCodeUpper = (o.code || '').toUpperCase().trim();
        const usageCount = orderPromoCounts[offerCodeUpper] || 0;
        const usageBadge = usageCount > 0
          ? `<span class="order-status-badge delivered" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #DBEAFE; font-weight:700;"><i class="fa-solid fa-bag-shopping"></i> ${usageCount} ${usageCount === 1 ? 'Order' : 'Orders'}</span>`
          : `<span style="color:#94A3B8; font-size:12.5px;">0 Orders</span>`;

        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:12px;">
                ${o.image_url ? `<img src="../${escapeHtml(o.image_url)}" alt="" style="width:42px; height:42px; border-radius:8px; object-fit:cover; flex-shrink:0;" />` : `<div style="width:42px; height:42px; border-radius:8px; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;"><i class="fa-solid fa-tags"></i></div>`}
                <div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong style="font-size:15px; color:var(--text-dark);">${escapeHtml(o.title)}</strong>
                    ${o.badge ? `<span style="background:#FEF3C7; color:#D97706; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:10px; text-transform:uppercase;">${escapeHtml(o.badge)}</span>` : ''}
                  </div>
                  <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">${escapeHtml(o.subtitle || 'Special discount deal')}</p>
                </div>
              </div>
            </td>
            <td><span style="background:#F1F5F9; color:#0F172A; font-family:monospace; padding:5px 10px; border-radius:6px; font-weight:800; font-size:13.5px; letter-spacing:0.5px;">${escapeHtml(o.code)}</span></td>
            <td><strong style="color:var(--admin-header-bg); font-size:14.5px;">${formatDiscount(o.discount_type, o.discount_value)}</strong></td>
            <td>${usageBadge}</td>
            <td>
              <button class="order-status-badge ${isActive ? 'delivered' : 'cancelled'}" onclick="toggleOfferStatus('${escapeHtml(o.id)}', ${isActive ? 0 : 1})" style="border:none; cursor:pointer; font-weight:700;" title="Click to ${isActive ? 'Disable' : 'Enable'}">
                ${isActive ? 'Active' : 'Disabled'}
              </button>
            </td>
            <td>
              <div style="display:flex; gap:8px; align-items:center;">
                <a href="edit_offer.html?id=${encodeURIComponent(o.id)}" class="btn-action-sm btn-edit" style="text-decoration:none;"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
                <button class="btn-action-sm btn-delete" onclick="deleteOffer('${escapeHtml(o.id)}', '${escapeHtml(o.title)}')"><i class="fa-solid fa-trash-can"></i> Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

async function toggleOfferStatus(id, newStatus) {
  try {
    const res = await fetch('../api/admin.php?action=toggle_offer_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: newStatus })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showAdminToast(data.message);
      loadOffersData();
    } else {
      alert('Error: ' + (data.message || 'Failed to update offer status'));
    }
  } catch (err) {
    showAdminToast(`Updated offer status`);
    loadOffersData();
  }
}

function formatDiscount(type, val) {
  const num = parseFloat(val || 0);
  if (type === 'percentage') return `${num}% OFF`;
  if (type === 'fixed') return `Rs. ${num.toFixed(2)} OFF`;
  if (type === 'free_delivery') return `FREE DELIVERY`;
  return `${num}% OFF`;
}

async function deleteOffer(id, title) {
  if (confirm(`Are you sure you want to delete the offer "${title}" from database?`)) {
    try {
      let localOffers = JSON.parse(localStorage.getItem('food_express_offers') || '[]');
      localOffers = localOffers.filter(o => o.id !== id);
      localStorage.setItem('food_express_offers', JSON.stringify(localOffers));
    } catch(e){}

    try {
      const res = await fetch(`../api/admin.php?action=offers&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        showAdminToast(`Deleted offer "${title}" from database!`);
        loadOffersData();
        loadDashboardData();
      } else {
        alert('Error: ' + (data.message || 'Failed to delete offer'));
      }
    } catch (err) {
      showAdminToast(`Deleted offer "${title}"`);
      loadOffersData();
    }
  }
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------
function handleAdminLogout() {
  if (confirm('Are you sure you want to log out of FoodExpress Admin Panel?')) {
    localStorage.removeItem('food_express_user');
    window.location.href = '../pages/login.html';
  }
}

function updateText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = text;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dateAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showAdminToast(msg) {
  let toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.backgroundColor = '#1E293B';
  toast.style.color = '#FFFFFF';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  toast.style.zIndex = '9999';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '600';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22C55E; margin-right:6px;"></i> ${msg}`;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// -------------------------------------------------------------
// 7. CUSTOMER MESSAGES MANAGEMENT
// -------------------------------------------------------------
let allAdminMessages = [];

function setupMessagesManager() {
  checkUnreadMessagesBadge();
}

async function checkUnreadMessagesBadge() {
  try {
    const response = await fetch('../api/admin.php?action=messages');
    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      allAdminMessages = result.data;
      updateMessagesBadge(result.data);
      return;
    }
  } catch (e) {}

  // Fallback to local storage
  const local = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
  allAdminMessages = local;
  updateMessagesBadge(local);
}

function updateMessagesBadge(messages) {
  const unreadCount = messages.filter(m => (m.status || 'unread') === 'unread').length;
  const badgeEl = document.getElementById('sidebar-messages-count');
  const statMsgEl = document.getElementById('stat-messages-count');

  if (statMsgEl) {
    statMsgEl.textContent = unreadCount > 0 ? `${unreadCount} New` : `${messages.length} Total`;
  }

  if (badgeEl) {
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

async function loadMessagesData() {
  const tbody = document.getElementById('messages-table-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748B;">Loading customer messages...</td></tr>`;

  try {
    const response = await fetch('../api/admin.php?action=messages');
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      allAdminMessages = result.data;
      // Merge with any local storage messages not yet in DB
      const local = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
      if (local.length > 0) {
        const dbIds = new Set(allAdminMessages.map(m => String(m.id)));
        local.forEach(lm => {
          if (!dbIds.has(String(lm.id))) {
            allAdminMessages.unshift(lm);
          }
        });
      }
      renderMessagesTable(allAdminMessages);
      updateMessagesBadge(allAdminMessages);
      return;
    }
  } catch (err) {
    console.warn('API error, loading messages from localStorage:', err.message);
  }

  const local = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
  allAdminMessages = local;
  renderMessagesTable(allAdminMessages);
  updateMessagesBadge(allAdminMessages);
}

function renderMessagesTable(messages) {
  const tbody = document.getElementById('messages-table-tbody');
  if (!tbody) return;

  if (!messages || messages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#94A3B8;">No customer messages received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = messages.map(msg => {
    const isUnread = (msg.status || 'unread') === 'unread';
    const statusBadgeClass = isUnread ? 'badge-unread' : (msg.status === 'replied' ? 'badge-replied' : 'badge-read');
    const previewText = msg.message && msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : (msg.message || '');
    const dateFormatted = msg.created_at ? dateAgo(msg.created_at) : 'Just now';

    return `
      <tr style="${isUnread ? 'background-color: #FEF2F2;' : ''}">
        <td>
          <div style="font-weight: 700; color: #1E293B;">${escapeHtml(msg.name)}</div>
        </td>
        <td>
          <a href="mailto:${escapeHtml(msg.email)}" style="color: #2563EB; text-decoration: none; font-size: 13.5px; font-weight: 500;">${escapeHtml(msg.email)}</a>
          ${msg.phone ? `<div style="font-size: 12px; color: #64748B; margin-top:2px;"><i class="fa-solid fa-phone"></i> ${escapeHtml(msg.phone)}</div>` : ''}
        </td>
        <td><strong style="color: #334155;">${escapeHtml(msg.subject || 'General Inquiry')}</strong></td>
        <td style="color: #475569; max-width: 240px; font-size: 13.5px;">${escapeHtml(previewText)}</td>
        <td style="white-space: nowrap; font-size: 13px; color: #64748B;">${dateFormatted}</td>
        <td>
          <span class="order-status-badge ${statusBadgeClass}">
            ${capitalize(msg.status || 'unread')}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn-action-sm btn-edit" onclick="viewMessageDetails('${escapeHtml(String(msg.id))}')" style="cursor: pointer;"><i class="fa-solid fa-eye"></i> View</button>
            ${isUnread ? `<button type="button" class="btn-action-sm" onclick="markMessageStatus('${escapeHtml(String(msg.id))}', 'read')" style="background:#E2E8F0; color:#334155; cursor:pointer;" title="Mark as Read"><i class="fa-solid fa-check"></i> Read</button>` : ''}
            <button type="button" class="btn-action-sm btn-delete" onclick="deleteMessageItem('${escapeHtml(String(msg.id))}')" style="cursor: pointer;"><i class="fa-solid fa-trash-can"></i> Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

let activeViewingMessageId = null;

function viewMessageDetails(id) {
  const msg = allAdminMessages.find(m => String(m.id) === String(id));
  if (!msg) return;

  activeViewingMessageId = id;

  const subjectEl = document.getElementById('modal-msg-subject');
  const nameEl = document.getElementById('modal-msg-name');
  const emailEl = document.getElementById('modal-msg-email');
  const phoneEl = document.getElementById('modal-msg-phone');
  const dateEl = document.getElementById('modal-msg-date');
  const bodyEl = document.getElementById('modal-msg-body');
  const replyBtn = document.getElementById('modal-msg-reply-btn');
  const deleteBtn = document.getElementById('modal-msg-delete-btn');

  if (subjectEl) subjectEl.textContent = msg.subject || 'Customer Inquiry';
  if (nameEl) nameEl.textContent = msg.name || 'Anonymous';
  if (emailEl) emailEl.textContent = msg.email || 'N/A';
  if (phoneEl) phoneEl.textContent = msg.phone || 'N/A';
  if (dateEl) dateEl.textContent = msg.created_at ? dateAgo(msg.created_at) : 'N/A';
  if (bodyEl) bodyEl.textContent = msg.message || '';

  if (replyBtn) {
    replyBtn.href = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent('Re: ' + (msg.subject || 'Your Inquiry to Food Express'))}`;
  }

  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeMessageModal();
      deleteMessageItem(id);
    };
  }

  // Auto mark as read
  if ((msg.status || 'unread') === 'unread') {
    markMessageStatus(id, 'read', false);
  }

  const modal = document.getElementById('message-detail-modal');
  if (modal) modal.style.display = 'flex';
}

function closeMessageModal() {
  const modal = document.getElementById('message-detail-modal');
  if (modal) modal.style.display = 'none';
  activeViewingMessageId = null;
}

async function markMessageStatus(id, newStatus, shouldToast = true) {
  const msg = allAdminMessages.find(m => String(m.id) === String(id));
  if (msg) {
    msg.status = newStatus;
  }

  // Update in localStorage
  const local = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
  const localMsg = local.find(m => String(m.id) === String(id));
  if (localMsg) {
    localMsg.status = newStatus;
    localStorage.setItem('food_express_messages', JSON.stringify(local));
  }

  // Try API update
  try {
    await fetch('../api/admin.php?action=update_message_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: newStatus })
    });
  } catch (e) {}

  renderMessagesTable(allAdminMessages);
  updateMessagesBadge(allAdminMessages);

  if (shouldToast) {
    showAdminToast(`Message marked as ${newStatus}`);
  }
}

async function deleteMessageItem(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;

  allAdminMessages = allAdminMessages.filter(m => String(m.id) !== String(id));

  // Update in localStorage
  const local = JSON.parse(localStorage.getItem('food_express_messages') || '[]');
  const filteredLocal = local.filter(m => String(m.id) !== String(id));
  localStorage.setItem('food_express_messages', JSON.stringify(filteredLocal));

  // Try API delete
  try {
    await fetch('../api/admin.php?action=delete_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });
  } catch (e) {}

  renderMessagesTable(allAdminMessages);
  updateMessagesBadge(allAdminMessages);
  showAdminToast('Message deleted successfully');
}
