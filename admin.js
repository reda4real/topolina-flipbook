// Admin Configuration
const ADMIN_PASSWORD = null; // Security fix: Password removed from client-side; validation is server-side
const SESSION_KEY = 'topolina_admin_session';
const ORDERS_KEY = 'topolina_orders';

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const ordersTable = document.getElementById('ordersTable');
const filterBtns = document.querySelectorAll('.filter-btn');
const confirmModal = document.getElementById('confirmModal');
const modalMessage = document.getElementById('modalMessage');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const orderDetailsModal = document.getElementById('orderDetailsModal');
const orderDetailsContent = document.getElementById('orderDetailsContent');

// Product Management Elements
const productSelector = document.getElementById('productSelector');
const productEditor = document.getElementById('productEditor');
const resetProductsBtn = document.getElementById('resetProductsBtn');

// Image Management Elements
const imageProductSelector = document.getElementById('imageProductSelector');
const imageEditor = document.getElementById('imageEditor');
const saveImagesBtn = document.getElementById('saveImagesBtn');
const inventoryProductSelector = document.getElementById('inventoryProductSelector');
const inventoryEditor = document.getElementById('inventoryEditor');
const saveInventoryBtn = document.getElementById('saveInventoryBtn');

// State
let currentFilter = 'all';
let pendingAction = null;
let currentProduct = null;
let currentImageProduct = null;
let currentInventoryProduct = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    checkSession();
    setupEventListeners();
    await fetchProducts(); // Ensure products are loaded
    initializeProductSelector();
});

// Session Management
function checkSession() {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
        showDashboard();
    }
}

async function login(password) {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem(SESSION_KEY, data.token);
            showDashboard();
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    showLogin();
}

function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadOrders();
    loadOrders();
    initializeImageProductSelector();
    initializeInventoryProductSelector();
}

function showLogin() {
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
    loginForm.reset();
    loginError.textContent = '';
}

// Event Listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        if (await login(password)) {
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Invalid password';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadOrders();
        });
    });

    // Modal
    modalCancel.addEventListener('click', closeModal);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });

    // Order Details Modal
    const modalClose = orderDetailsModal.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            orderDetailsModal.classList.remove('active');
        });
    }
    orderDetailsModal.addEventListener('click', (e) => {
        if (e.target === orderDetailsModal) {
            orderDetailsModal.classList.remove('active');
        }
    });

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Product Management
    if (productSelector) {
        productSelector.addEventListener('change', (e) => {
            const productKey = e.target.value;
            if (productKey) {
                loadProductEditor(productKey);
            } else {
                productEditor.innerHTML = '<p class="no-orders">Select a product to start editing</p>';
            }
        });
    }

    if (resetProductsBtn) {
        resetProductsBtn.addEventListener('click', () => {
            if (resetToDefaults()) {
                initializeProductSelector();
                productEditor.innerHTML = '<p class="no-orders">Products reset! Select a product to start editing</p>';
                alert('All products have been reset to defaults!');
            }
        });
    }

    // Image Management
    if (imageProductSelector) {
        imageProductSelector.addEventListener('change', (e) => {
            const productKey = e.target.value;
            if (productKey) {
                loadImageEditor(productKey);
            } else {
                imageEditor.innerHTML = '<p class="no-orders">Select a product to manage images</p>';
                saveImagesBtn.style.display = 'none';
            }
        });
    }

    if (saveImagesBtn) {
        saveImagesBtn.addEventListener('click', saveImageChanges);
    }

    // Inventory Management
    if (inventoryProductSelector) {
        inventoryProductSelector.addEventListener('change', (e) => {
            const productKey = e.target.value;
            if (productKey) {
                loadInventoryEditor(productKey);
            } else {
                inventoryEditor.innerHTML = '<p class="no-orders">Select a product to manage inventory</p>';
                saveInventoryBtn.style.display = 'none';
            }
        });
    }

    if (saveInventoryBtn) {
        saveInventoryBtn.addEventListener('click', saveInventory);
    }
}

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
    }

    if (tabName === 'images') {
        initializeImageProductSelector();
    } else if (tabName === 'inventory') {
        initializeInventoryProductSelector();
    }
}

// Order Management
function getOrders() {
    const ordersJSON = localStorage.getItem(ORDERS_KEY);
    return ordersJSON ? JSON.parse(ordersJSON) : [];
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

async function loadOrders() {
    const token = localStorage.getItem(SESSION_KEY);
    try {
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) { logout(); return; }

        const orders = await response.json();
        const filteredOrders = filterOrders(orders, currentFilter);

        updateStats(orders);
        displayOrders(filteredOrders);
    } catch (e) {
        console.error("Failed to load orders", e);
        ordersTable.innerHTML = '<p class="error">Failed to load orders.</p>';
    }
}

function filterOrders(orders, filter) {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
}

function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('confirmedOrders').textContent = confirmed;
}

function displayOrders(orders) {
    if (orders.length === 0) {
        ordersTable.innerHTML = '<p class="no-orders">No orders found</p>';
        return;
    }

    ordersTable.innerHTML = orders.map(order => createOrderCard(order)).join('');

    // Attach event listeners to action buttons
    attachOrderActions();
}

function createOrderCard(order) {
    const date = new Date(order.timestamp).toLocaleString();
    const statusClass = order.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
    const statusText = order.status === 'confirmed' ? 'Confirmed' : 'Pending';

    const patternsPreview = order.items.slice(0, 3).map(item =>
        `<span class="pattern-item">${item.product} - ${item.quantity}x</span>`
    ).join('');

    const moreItems = order.items.length > 3 ?
        `<span class="pattern-item">+${order.items.length - 3} more...</span>` : '';

    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-info">
                    <h3>${order.contactPerson || order.name}</h3>
                    <p class="order-meta">📧 ${order.email}</p>
                    ${order.company ? `<p class="order-meta">🏢 ${order.company}</p>` : ''}
                    ${order.phone ? `<p class="order-meta">📱 ${order.phone}</p>` : ''}
                    <p class="order-meta">🕒 ${date}</p>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-details">
                <h4>Patterns (${order.items.length} items)</h4>
                <div class="patterns-list">
                    ${patternsPreview}
                    ${moreItems}
                </div>
            </div>
            <div class="order-actions">
                <button class="btn-view" data-action="view" data-order-id="${order.id}">View Full Order</button>
                ${order.status === 'pending' ?
            `<button class="btn-success" data-action="confirm" data-order-id="${order.id}">Confirm Order</button>` :
            `<button class="btn-secondary" data-action="unconfirm" data-order-id="${order.id}">Mark as Pending</button>`
        }
                <button class="btn-danger" data-action="delete" data-order-id="${order.id}">Delete</button>
            </div>
        </div>
    `;
}

function attachOrderActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const orderId = e.target.dataset.orderId;
            handleOrderAction(action, orderId);
        });
    });
}

async function handleOrderAction(action, orderId) {
    if (action === 'view') {
        // Need to find the order object. Since we don't have it in memory easily without re-fetching or storing globally,
        // let's just fetch all again or optimize. For now, fetching all is fine for admin panel scale.
        const token = localStorage.getItem(SESSION_KEY);
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();
        const order = orders.find(o => o.id === orderId);
        if (order) showOrderDetails(order);
        return;
    }

    /* 
       For confirm/delete, we pass the ID to the handlers.
    */
    switch (action) {
        case 'confirm':
            showConfirmDialog(
                `Confirm and archive order?`,
                () => confirmOrder(orderId)
            );
            break;
        case 'unconfirm':
            confirmOrder(orderId, 'pending'); // Reuse confirmOrder for status change
            break;
        case 'delete':
            showConfirmDialog(
                `Delete order? This action cannot be undone.`,
                () => deleteOrder(orderId)
            );
            break;
    }
}

async function confirmOrder(orderId, status = 'confirmed') {
    const token = localStorage.getItem(SESSION_KEY);
    try {
        await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        loadOrders();
    } catch (e) {
        console.error(e);
        alert('Failed to update order');
    }
}

async function deleteOrder(orderId) {
    const token = localStorage.getItem(SESSION_KEY);
    try {
        await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadOrders();
    } catch (e) {
        console.error(e);
        alert('Failed to delete order');
    }
}

function showOrderDetails(order) {
    const date = new Date(order.timestamp).toLocaleString();
    const statusClass = order.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
    const statusText = order.status === 'confirmed' ? 'Confirmed' : 'Pending';

    const content = `
        <div class="order-details-full">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h2 style="color: #000000; margin-bottom: 10px;">${order.contactPerson || order.name}</h2>
                    <p style="color: #333333; margin-bottom: 5px;">📧 ${order.email}</p>
                    ${order.company ? `<p style="color: #333333; margin-bottom: 5px;">🏢 ${order.company}</p>` : ''}
                    ${order.taxId ? `<p style="color: #333333; margin-bottom: 5px;">🆔 Tax ID: ${order.taxId}</p>` : ''}
                    ${order.phone ? `<p style="color: #333333; margin-bottom: 5px;">📱 ${order.phone}</p>` : ''}
                    <p style="color: #666666; font-size: 0.9rem;">🕒 ${date}</p>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            
            ${(order.address || order.streetAddress) ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0;">
                    <h4 style="color: #333333; margin-bottom: 10px;">📍 Delivery Address</h4>
                    <p style="color: #000000; white-space: pre-line;">
                        ${order.address ||
            `${order.streetAddress}
                        ${order.city}, ${order.state || ''} ${order.postalCode}
                        ${order.country}`}
                    </p>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #333333; margin-bottom: 15px;">📦 Ordered Patterns (${order.items.length} items)</h4>
                <div style="display: grid; gap: 15px;">
                    ${order.items.map(item => `
                        <div style="padding: 15px; background: #f9f9f9; border: 2px solid #000000; border-radius: 0; display: flex; align-items: center; gap: 15px;">
                            ${item.image ? `<img src="${item.image}" alt="${item.product}" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid #ddd;">` : ''}
                            <div style="flex: 1;">
                                <div style="color: #000000; font-weight: 500; margin-bottom: 5px;">${item.product}</div>
                                <div style="color: #666666; font-size: 0.9rem;">Quantity: <strong style="color: #000000;">${item.quantity}</strong></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${order.notes ? `
                <div style="padding: 15px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0;">
                    <h4 style="color: #333333; margin-bottom: 10px;">📝 Notes</h4>
                    <p style="color: #000000; white-space: pre-line;">${order.notes}</p>
                </div>
            ` : ''}
        </div>
    `;

    orderDetailsContent.innerHTML = content;
    orderDetailsModal.classList.add('active');
}

// Modal Functions
function showConfirmDialog(message, onConfirm) {
    modalMessage.textContent = message;
    confirmModal.classList.add('active');

    pendingAction = onConfirm;

    modalConfirm.onclick = () => {
        if (pendingAction) pendingAction();
        closeModal();
    };
}

function closeModal() {
    confirmModal.classList.remove('active');
    pendingAction = null;
}

// ========== PRODUCT MANAGEMENT ==========

function initializeProductSelector() {
    const products = getProducts();
    productSelector.innerHTML = '<option value="">Select a product to manage...</option>';

    Object.keys(products).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = products[key].displayName;
        productSelector.appendChild(option);
    });
}

function loadProductEditor(productKey) {
    const products = getProducts();
    const product = products[productKey];

    if (!product) {
        productEditor.innerHTML = '<p class="no-orders">Product not found</p>';
        return;
    }

    currentProduct = { key: productKey, data: JSON.parse(JSON.stringify(product)) };

    renderProductEditor();
}

function renderProductEditor() {
    const { key, data } = currentProduct;

    productEditor.innerHTML = `
        <div class="product-header">
            <h2>${data.displayName}</h2>
        </div>

        <div class="product-info-section">
            <h3>Product Information</h3>
            <div class="form-row">
                <div class="form-field">
                    <label>Display Name</label>
                    <input type="text" id="productDisplayName" value="${data.displayName}">
                </div>
            </div>
        </div>

        <div class="patterns-section">
            <h3>
                <span>Patterns (${data.patterns.length})</span>
                <button class="btn-add-pattern" onclick="addNewPattern()">+ Add Pattern</button>
            </h3>
            <div class="patterns-grid" id="patternsGrid">
                ${data.patterns.map((pattern, index) => renderPatternCard(pattern, index)).join('')}
            </div>
        </div>

        <button class="save-product-btn" onclick="saveProduct()">💾 Save Changes</button>
    `;

    // Attach event listeners
    document.getElementById('productDisplayName').addEventListener('input', (e) => {
        currentProduct.data.displayName = e.target.value;
    });
}

function renderPatternCard(pattern, index) {
    return `
        <div class="pattern-card" data-pattern-index="${index}">
            <div class="pattern-image-container">
                ${pattern.image ?
            `<img src="${pattern.image}" alt="${pattern.name}">` :
            `<div class="pattern-image-placeholder">No image</div>`
        }
            </div>
            <div class="pattern-info">
                <input type="text" 
                       placeholder="Pattern ID" 
                       value="${pattern.id}" 
                       onchange="updatePatternField(${index}, 'id', this.value)">
                <input type="text" 
                       placeholder="Pattern Name" 
                       value="${pattern.name}" 
                       onchange="updatePatternField(${index}, 'name', this.value)">
            </div>
            <div class="pattern-actions">
                <label class="btn-small btn-change-image file-upload-label">
                    Change Image
                    <input type="file" accept="image/*" onchange="handleImageUpload(${index}, this)">
                </label>
                <button class="btn-small btn-delete-pattern" onclick="deletePattern(${index})">Delete</button>
            </div>
        </div>
    `;
}

window.updatePatternField = function (index, field, value) {
    if (currentProduct && currentProduct.data.patterns[index]) {
        currentProduct.data.patterns[index][field] = value;
    }
};

window.handleImageUpload = async function (index, input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem(SESSION_KEY);

    try {
        // Show loading state if possible, or just wait
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            if (currentProduct && currentProduct.data.patterns[index]) {
                currentProduct.data.patterns[index].image = data.filepath;
                renderProductEditor();
            }
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Upload failed');
    }
};

window.addNewPattern = function () {
    if (!currentProduct) return;

    const newPattern = {
        id: `NEW${Date.now()}`,
        name: `New Pattern ${currentProduct.data.patterns.length + 1}`,
        image: ''
    };

    currentProduct.data.patterns.push(newPattern);
    renderProductEditor();
};

window.deletePattern = function (index) {
    if (!currentProduct) return;

    if (confirm('Are you sure you want to delete this pattern?')) {
        currentProduct.data.patterns.splice(index, 1);
        renderProductEditor();
    }
};

window.saveProduct = async function () {
    if (!currentProduct) return;

    const products = getProducts();
    products[currentProduct.key] = currentProduct.data;

    // Helper function in products-data.js is now async
    if (await saveProducts(products)) {
        alert('✅ Product saved successfully!\n\n' +
            '📖 To see changes in the flipbook:\n' +
            '1. Go to the flipbook (index.html)\n' +
            '2. Refresh the page (F5 or Ctrl+R)\n' +
            '3. Navigate to the product you edited\n\n' +
            'Your changes are now live!');

        // Reload the product editor to show updated data
        loadProductEditor(currentProduct.key);
    }
};


// ========== INVENTORY MANAGEMENT ==========
function initializeInventoryProductSelector() {
    const products = getProducts();
    if (!inventoryProductSelector) return;

    inventoryProductSelector.innerHTML = '<option value="">Select a product to manage inventory...</option>';

    Object.keys(products).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = products[key].displayName;
        inventoryProductSelector.appendChild(option);
    });
}

function loadInventoryEditor(productKey) {
    const products = getProducts();
    const product = products[productKey];

    if (!product) {
        inventoryEditor.innerHTML = '<p class="no-orders">Product not found</p>';
        saveInventoryBtn.style.display = 'none';
        return;
    }

    currentInventoryProduct = { key: productKey, data: JSON.parse(JSON.stringify(product)) };
    saveInventoryBtn.style.display = 'block';
    renderInventoryEditor();
}

function renderInventoryEditor() {
    const { key, data } = currentInventoryProduct;

    let consumptionInfo = '';
    if (data.consumption) {
        if (data.consumption.entire) {
            consumptionInfo = `<div style="background: #e8f5e9; padding: 10px; margin-bottom: 20px; border: 1px solid #c8e6c9; border-radius: 0;">
                <strong style="display:block; margin-bottom:5px;">📏 Fabric Consumption:</strong> 
                <span style="font-size: 1.1em;">${data.consumption.entire.toFixed(2)} meters</span> per unit
            </div>`;
        } else {
            consumptionInfo = `<div style="background: #e8f5e9; padding: 10px; margin-bottom: 20px; border: 1px solid #c8e6c9; border-radius: 0;">
                <strong style="display:block; margin-bottom:5px;">📏 Fabric Consumption:</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>Outer: <strong>${data.consumption.outside.toFixed(2)} m</strong></div>
                    <div>Inner: <strong>${data.consumption.inside.toFixed(2)} m</strong></div>
                </div>
            </div>`;
        }
    } else {
        consumptionInfo = `<div style="background: #fff3e0; padding: 10px; margin-bottom: 20px; border: 1px solid #ffcc80; border-radius: 0;">
            <strong>⚠️ No consumption data available</strong> for this product.
        </div>`;
    }

    inventoryEditor.innerHTML = `
        <div class="product-header">
            <h2>${data.displayName}</h2>
            <p>Set available meters for each pattern.</p>
        </div>
        
        ${consumptionInfo}

        <div class="patterns-grid">
            ${data.patterns.map((pattern, index) => renderInventoryCard(pattern, index)).join('')}
        </div>
    `;
}

function renderInventoryCard(pattern, index) {
    // Determine active type (default to meters)
    const stockType = pattern.stockType || 'meters'; // 'meters' | 'quantity'
    const isMeters = stockType === 'meters';

    // Get values (default to 0 if undefined)
    const meters = pattern.availableMeters !== undefined ? pattern.availableMeters : 0;
    const quantity = pattern.availableQuantity !== undefined ? pattern.availableQuantity : 0;

    return `
        <div class="pattern-card">
            <div style="display: flex; gap: 15px; align-items: center;">
                <div style="width: 80px; height: 80px; background: #eee; border: 1px solid #ddd;">
                     ${pattern.image ? `<img src="${pattern.image}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                </div>
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 5px;">${pattern.name}</h4>
                    <small style="color: #666; display: block; margin-bottom: 5px;">ID: ${pattern.id}</small>
                </div>
            </div>
            
            <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.85rem; color: #666; font-weight: 500;">Tracking Mode:</label>
                    <select onchange="updateInventoryType(${index}, this.value)" style="padding: 4px; border: 1px solid #ccc; font-size: 0.85rem;">
                        <option value="meters" ${isMeters ? 'selected' : ''}>📏 Fabric (Meters)</option>
                        <option value="quantity" ${!isMeters ? 'selected' : ''}>📦 Ready Stock (Units)</option>
                    </select>
                </div>

                ${isMeters ? `
                    <div>
                        <label style="display: block; font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; color: #2e7d32;">
                            Available Fabric (m)
                        </label>
                        <input type="number" 
                               value="${meters}" 
                               min="0" 
                               step="0.1" 
                               style="width: 100%; font-size: 1.1rem; padding: 8px; border: 2px solid #2e7d32;"
                               onchange="updateInventoryValue(${index}, 'availableMeters', this.value)">
                    </div>
                ` : `
                    <div>
                         <label style="display: block; font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; color: #1565c0;">
                            Ready Stock (Units)
                         </label>
                         <input type="number" 
                                value="${quantity}" 
                                min="0" 
                                step="1" 
                                style="width: 100%; font-size: 1.1rem; padding: 8px; border: 2px solid #1565c0;"
                                onchange="updateInventoryValue(${index}, 'availableQuantity', this.value)">
                    </div>
                `}
            </div>
        </div>
    `;
}

window.updateInventoryType = function (index, type) {
    if (currentInventoryProduct && currentInventoryProduct.data.patterns[index]) {
        currentInventoryProduct.data.patterns[index].stockType = type;
        renderInventoryEditor(); // Re-render to show correct input
    }
};

window.updateInventoryValue = function (index, field, value) {
    if (currentInventoryProduct && currentInventoryProduct.data.patterns[index]) {
        currentInventoryProduct.data.patterns[index][field] = parseFloat(value) || 0;
    }
};

window.saveInventory = async function () {
    if (!currentInventoryProduct) return;

    const products = getProducts();
    products[currentInventoryProduct.key] = currentInventoryProduct.data;

    // Use existing saveProducts function
    if (await saveProducts(products)) {
        alert('✅ Inventory saved successfully!');
    }
};

