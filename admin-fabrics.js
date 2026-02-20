
// State
let allFabrics = [];
let currentFabricId = null;
let fabricPatternsMap = {};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Hook into tab switch if needed, or rely on admin.js calling loadFabrics?
    // admin.js doesn't call loadFabrics automatically unless we add it there.
    // For now, let's keep the listener.
    const fabricTabBtn = document.querySelector('button[data-tab="fabrics"]');
    if (fabricTabBtn) {
        fabricTabBtn.addEventListener('click', loadFabrics);
    }

    // Add selector listener
    const selector = document.getElementById('fabricSelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadFabricEditor(e.target.value);
            } else {
                document.getElementById('fabricEditor').innerHTML = '<p class="no-orders">Select a fabric to start editing</p>';
            }
        });
    }
});

// --- API CALLS (Unchanged) ---
// ... (Keeping the same API functions: fetchFabrics, createFabricAPI, updateFabricAPI, linkPatternAPI, unlinkPatternAPI)
// We will just copy them over or assume they are there.
// For the `replace_file_content`, I will rewrite the whole file to be safe and clean.

async function fetchFabrics() {
    try {
        const response = await fetch('api/fabrics');
        if (!response.ok) throw new Error('Failed to fetch fabrics');
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function createFabricAPI(name, stock) {
    const token = localStorage.getItem('topolina_admin_session');
    const response = await fetch('api/fabrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, availableMeters: stock })
    });
    return response.json();
}

async function updateFabricAPI(id, name, stock) {
    const token = localStorage.getItem('topolina_admin_session');
    const response = await fetch(`api/fabrics/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, availableMeters: stock })
    });
    return response.json();
}

async function linkPatternAPI(productId, patternId, fabricId) {
    const token = localStorage.getItem('topolina_admin_session');
    const response = await fetch(`api/products/${productId}/patterns/${patternId}/fabric`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fabricId })
    });
    return response.json();
}

async function unlinkPatternAPI(productId, patternId) {
    const token = localStorage.getItem('topolina_admin_session');
    const response = await fetch(`api/products/${productId}/patterns/${patternId}/fabric`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

async function deleteFabricAPI(id) {
    const token = localStorage.getItem('topolina_admin_session');
    const response = await fetch(`api/fabrics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

async function deleteFabric(id) {
    if (!confirm("Are you sure you want to delete this fabric group? Linked patterns will be unlinked.")) return;

    const res = await deleteFabricAPI(id);
    if (res.success) {
        alert('Fabric group deleted.');
        currentFabricId = null;
        loadFabrics();
        document.getElementById('fabricEditor').innerHTML = '<p class="no-orders">Select a fabric to start editing</p>';
    } else {
        alert('Failed to delete: ' + res.error);
    }
}

// --- UI LOGIC ---

async function loadFabrics() {
    const selector = document.getElementById('fabricSelector');
    if (!selector) return; // Guard

    selector.innerHTML = '<option value="">Loading...</option>';

    // Fetch Fabrics AND Products
    const [fabrics, productsMap] = await Promise.all([
        fetchFabrics(),
        fetchProductsMap()
    ]);

    allFabrics = fabrics;

    // Build Map
    fabricPatternsMap = {};
    fabrics.forEach(f => fabricPatternsMap[f.id] = []);

    Object.keys(productsMap).forEach(key => {
        const product = productsMap[key];
        if (product.patterns) {
            product.patterns.forEach(p => {
                if (p.fabricId && fabricPatternsMap[p.fabricId]) {
                    fabricPatternsMap[p.fabricId].push({
                        productName: product.displayName,
                        patternName: p.name,
                        patternId: p.id,
                        productId: key,
                        image: p.image
                    });
                }
            });
        }
    });

    // Populate Dropdown
    selector.innerHTML = '<option value="">Select a fabric to manage...</option>';
    fabrics.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        selector.appendChild(option);
    });

    // Restore selection if exists and still valid
    if (currentFabricId && fabrics.find(f => f.id === currentFabricId)) {
        selector.value = currentFabricId;
        loadFabricEditor(currentFabricId);
    } else {
        document.getElementById('fabricEditor').innerHTML = '<p class="no-orders">Select a fabric to start editing</p>';
    }
}

// Helper
async function fetchProductsMap() {
    if (typeof getProducts === 'function') {
        const p = getProducts();
        if (Object.keys(p).length > 0) return p;
    }
    const res = await fetch('api/products');
    return await res.json();
}

function loadFabricEditor(fabricId) {
    currentFabricId = fabricId;
    const fabric = allFabrics.find(f => f.id === fabricId);
    if (!fabric) return;

    const patterns = fabricPatternsMap[fabricId] || [];
    const editor = document.getElementById('fabricEditor');

    // Reusing Admin CSS classes
    editor.innerHTML = `
        <div class="product-header">
            <h2>${fabric.name}</h2>
            <div style="display: flex; gap: 10px;">
                <button class="btn-danger" style="width: auto; padding: 10px 20px;" onclick="deleteFabric('${fabric.id}')">
                    🗑️ Delete Group
                </button>
                <button class="btn-primary" style="width: auto; padding: 10px 20px;" onclick="saveFabricDetails('${fabric.id}')">
                    💾 Save Changes
                </button>
            </div>
        </div>

        <div class="product-info-section">
            <h3>Inventory Status</h3>
            <div class="form-row">
                <div class="form-field">
                    <label>Fabric ID</label>
                    <input type="text" value="${fabric.id}" disabled style="background: #f0f0f0; color: #555;"> 
                </div>
                <!-- Dark mode specific style for disabled input should be handled by CSS now, but inline style might override it. 
                     Removing inline background to let CSS handle it, or using a class if needed. 
                     Actually, let's use the CSS class approach or just rely on the global CSS update.
                     Removing inline styles that conflict with dark mode. -->
                 
                 <div class="form-field">
                    <label>Fabric Name</label>
                    <input type="text" id="editFabricName" value="${fabric.name}">
                </div>

                <div class="form-field">
                    <label>Available Stock (Meters)</label>
                    <input type="number" id="editFabricStock" value="${fabric.availableMeters}" step="0.01">
                </div>
            </div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                * Update the stock amount above and click "Save Changes" to apply.
            </div>
        </div>

        <div class="patterns-section">
            <h3>
                <span>Linked Patterns (${patterns.length})</span>
                <button class="btn-add-pattern" onclick="openLinkModal('${fabric.id}', '${fabric.name}')">+ Link Pattern</button>
            </h3>
            
            <div class="patterns-grid">
                ${patterns.length > 0 ? patterns.map(p => renderFabricPatternCard(p)).join('') : '<p style="color:#666; font-style:italic;">No patterns linked to this fabric group yet.</p>'}
            </div>
        </div>
    `;
}

async function saveFabricDetails(id) {
    const nameInput = document.getElementById('editFabricName');
    const stockInput = document.getElementById('editFabricStock');

    const name = nameInput.value;
    const stock = parseFloat(stockInput.value);

    if (!name) return alert("Fabric name cannot be empty.");
    if (isNaN(stock)) return alert("Invalid stock amount.");

    // Optimistic UI update or wait? Let's wait.
    const btn = document.querySelector('.product-header .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const res = await updateFabricAPI(id, name, stock);
        if (res.success) {
            alert("Changes saved successfully!");
            loadFabrics(); // Reload to refresh state
        } else {
            alert('Failed to save: ' + res.error);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred while saving.");
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function renderFabricPatternCard(p) {
    return `
        <div class="pattern-card">
            <div class="pattern-image-container" style="height: 120px;">
                ${p.image ? `<img src="${p.image}" alt="${p.patternName}">` : '<div class="pattern-image-placeholder">No image</div>'}
            </div>
            <div class="pattern-info">
                 <div style="font-weight: bold; margin-bottom: 4px;">${p.patternName}</div>
                 <div style="font-size: 0.85rem; color: #666;">${p.productName}</div>
            </div>
            <div class="pattern-actions">
                <button class="btn-small btn-delete-pattern" onclick="unlinkPattern('${p.productId}', '${p.patternId}')">Unlink</button>
            </div>
        </div>
    `;
}

// --- MODAL & ACTIONS ---

function showAddFabricModal() {
    document.getElementById('newFabricName').value = '';
    document.getElementById('newFabricStock').value = '0';
    document.getElementById('addFabricModal').classList.add('active');
}

function closeAddFabricModal() {
    document.getElementById('addFabricModal').classList.remove('active');
}

async function submitNewFabric() {
    const name = document.getElementById('newFabricName').value;
    const stock = parseFloat(document.getElementById('newFabricStock').value) || 0;

    if (!name) return alert('Name is required');

    const res = await createFabricAPI(name, stock);
    if (res.success) {
        closeAddFabricModal();
        currentFabricId = res.id; // Select the new fabric
        loadFabrics();
    } else {
        alert('Failed: ' + res.error);
    }
}

async function editFabricStock(id, currentName, currentStock) {
    // We could make a nicer modal, but prompt is okay for now or we reuse the create modal?
    // Let's use prompt for simplicity as requested "look like", focusing on the layout mainly.
    // Actually, "Product Management" has inputs to edit. 
    // Maybe we should allow inline editing? 
    // Providing a prompt is safer for stock updates to avoid accidental typose.

    const newStock = prompt(`Update stock (meters) for ${currentName}:`, currentStock);
    if (newStock !== null) {
        const stockVal = parseFloat(newStock);
        if (isNaN(stockVal)) return alert("Invalid number");

        const res = await updateFabricAPI(id, currentName, stockVal);
        if (res.success) {
            loadFabrics();
        } else {
            alert('Failed: ' + res.error);
        }
    }
}


// Linking
function openLinkModal(fabricId, fabricName) {
    // linkingFabricId is not global anymore, passing explicitly or setting it
    window.linkingFabricId = fabricId;
    document.getElementById('linkingFabricName').textContent = `Linking to: ${fabricName}`;

    // Populate Products
    const products = getProducts();
    const selector = document.getElementById('linkProductSelector');
    selector.innerHTML = '<option value="">Select Product...</option>';

    Object.keys(products).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = products[key].displayName;
        selector.appendChild(option);
    });

    document.getElementById('linkPatternSelector').innerHTML = '<option value="">Select Pattern...</option>';
    document.getElementById('linkPatternModal').classList.add('active');
}

function closeLinkPatternModal() {
    document.getElementById('linkPatternModal').classList.remove('active');
    window.linkingFabricId = null;
}

function populateLinkPatterns() {
    const productKey = document.getElementById('linkProductSelector').value;
    const patternSelector = document.getElementById('linkPatternSelector');
    patternSelector.innerHTML = '<option value="">Select Pattern...</option>';

    if (!productKey) return;

    const products = getProducts();
    const product = products[productKey];

    product.patterns.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (ID: ${p.id})`;
        if (p.fabricId) {
            option.textContent += ' [Already Linked]';
            option.disabled = true;
        }
        patternSelector.appendChild(option);
    });
}

async function submitLinkPattern() {
    const productId = document.getElementById('linkProductSelector').value;
    const patternId = document.getElementById('linkPatternSelector').value;
    const fabricId = window.linkingFabricId;

    if (!productId || !patternId) return alert("Select product and pattern");

    const res = await linkPatternAPI(productId, patternId, fabricId);
    if (res.success) {
        closeLinkPatternModal();
        loadFabrics();
    } else {
        alert('Failed: ' + res.error);
    }
}

async function unlinkPattern(productId, patternId) {
    if (!confirm("Unlink this pattern from the fabric group? It will no longer share stock.")) return;

    const res = await unlinkPatternAPI(productId, patternId);
    if (res.success) {
        loadFabrics();
    } else {
        alert('Failed: ' + res.error);
    }
}
