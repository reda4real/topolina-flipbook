// Product Data Management System - Dynamic Version
// Updated to match server.js defaults (JPG migration)

let PRODUCTS_CACHE = null;

// Fetch products from the server
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Network response was not ok');
        PRODUCTS_CACHE = await response.json();
        return PRODUCTS_CACHE;
    } catch (e) {
        console.error("Failed to fetch products:", e);
        return {};
    }
}

// Synchronous getter for cached products (use after fetchProducts resolves)
function getProducts() {
    return PRODUCTS_CACHE || {};
}

// Save products (admin use)
async function saveProducts(products) {
    try {
        // Get token from admin session if available (since this is shared code)
        const token = localStorage.getItem('topolina_admin_session');

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(products)
        });

        if (!response.ok) throw new Error('Failed to save');

        // Update cache
        PRODUCTS_CACHE = products;

        // Trigger event for flipbook to reload
        window.dispatchEvent(new Event('productsUpdated'));
        return true;
    } catch (e) {
        console.error("Error saving products:", e);
        alert('Error saving products. Please check your connection.');
        return false;
    }
}

function resetToDefaults() {
    if (confirm('This relies on the server database. To reset, please contact the administrator or use the database tools.')) {
        // We could implement a specific API endpoint for reset if needed
        return false;
    }
    return false;
}
