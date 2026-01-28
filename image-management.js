
// ========== IMAGE MANAGEMENT ==========

// Initialize image product selector
function initializeImageProductSelector() {
    const products = getProducts();
    imageProductSelector.innerHTML = '<option value="">Select a product to manage images...</option>';

    Object.keys(products).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = products[key].displayName;
        imageProductSelector.appendChild(option);
    });
}

// Load image editor for a product
function loadImageEditor(productKey) {
    const products = getProducts();
    const product = products[productKey];

    if (!product) {
        imageEditor.innerHTML = '<p class="no-orders">Product not found</p>';
        return;
    }

    currentImageProduct = { key: productKey, data: JSON.parse(JSON.stringify(product)) };

    renderImageEditor();
    saveImagesBtn.style.display = 'block';
}

// Render image editor interface
function renderImageEditor() {
    const { key, data } = currentImageProduct;

    imageEditor.innerHTML = `
        <div class="product-header">
            <h2>${data.displayName} - Image Management</h2>
        </div>

        <!-- Cover Image Section -->
        <div class="image-section">
            <h3>📸 Cover Image</h3>
            <div class="image-preview-container">
                <div class="image-preview-box">
                    <div class="image-preview" id="coverImagePreview">
                        ${data.coverImage ?
            `<img src="${data.coverImage}" alt="Cover Image">` :
            `<div class="image-preview-placeholder">No cover image</div>`
        }
                    </div>
                    <div class="image-upload-controls">
                        <label class="btn-small btn-change-image file-upload-label">
                            📤 Upload New Cover Image
                            <input type="file" accept="image/*" onchange="handleCoverImageUpload(this)">
                        </label>
                        <div class="image-info">
                            <p><strong>Current:</strong> ${data.coverImage || 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sketch Image Section -->
        <div class="image-section">
            <h3>✏️ Sketch Image</h3>
            <div class="image-preview-container">
                <div class="image-preview-box">
                    <div class="image-preview" id="sketchImagePreview">
                        ${data.sketchImage ?
            `<img src="${data.sketchImage}" alt="Sketch Image">` :
            `<div class="image-preview-placeholder">No sketch image</div>`
        }
                    </div>
                    <div class="image-upload-controls">
                        <label class="btn-small btn-change-image file-upload-label">
                            📤 Upload New Sketch Image
                            <input type="file" accept="image/*" onchange="handleSketchImageUpload(this)">
                        </label>
                        <div class="image-info">
                            <p><strong>Current:</strong> ${data.sketchImage || 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shop Image Section (if applicable) -->
        ${getShopImageSection(key)}
    `;
}

// Get shop image section HTML
function getShopImageSection(productKey) {
    const shopImages = {
        'PONTALON': 'images/shop/SHOP1.jpg',
        'SANT MANCH': 'images/shop/SHOP2.jpg',
        'JUPE': 'images/shop/SHOP3.jpg',
        'MANTEAU DROIT': 'images/shop/SHOP4.jpg',
        'ROBE ESABEL': 'images/shop/SHOP5.jpg',
        'TOP ESABEL': 'images/shop/SHOP6.jpg',
        'MANTEAU 3/4': 'images/shop/SHOP7.jpg',
        'MANTEAU LONG': 'images/shop/SHOP8.jpg',
        'VEST': 'images/shop/SHOP9.jpg',
        'ROBE LONG': 'images/shop/SHOP10.jpg'
    };

    if (!shopImages[productKey]) {
        return '';
    }

    // Store shop image in product data if not exists
    if (!currentImageProduct.data.shopImage) {
        currentImageProduct.data.shopImage = shopImages[productKey];
    }

    return `
        <div class="image-section">
            <h3>🛍️ Shop Image</h3>
            <div class="image-preview-container">
                <div class="image-preview-box">
                    <div class="image-preview" id="shopImagePreview">
                        ${currentImageProduct.data.shopImage ?
            `<img src="${currentImageProduct.data.shopImage}" alt="Shop Image">` :
            `<div class="image-preview-placeholder">No shop image</div>`
        }
                    </div>
                    <div class="image-upload-controls">
                        <label class="btn-small btn-change-image file-upload-label">
                            📤 Upload New Shop Image
                            <input type="file" accept="image/*" onchange="handleShopImageUpload(this)">
                        </label>
                        <div class="image-info">
                            <p><strong>Current:</strong> ${currentImageProduct.data.shopImage || 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Handle cover image upload
window.handleCoverImageUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentImageProduct.data.coverImage = e.target.result;
        document.getElementById('coverImagePreview').innerHTML =
            `<img src="${e.target.result}" alt="Cover Image">`;
    };
    reader.readAsDataURL(file);
};

// Handle sketch image upload
window.handleSketchImageUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentImageProduct.data.sketchImage = e.target.result;
        document.getElementById('sketchImagePreview').innerHTML =
            `<img src="${e.target.result}" alt="Sketch Image">`;
    };
    reader.readAsDataURL(file);
};

// Handle shop image upload
window.handleShopImageUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentImageProduct.data.shopImage = e.target.result;
        document.getElementById('shopImagePreview').innerHTML =
            `<img src="${e.target.result}" alt="Shop Image">`;
    };
    reader.readAsDataURL(file);
};

// Save image changes
window.saveImageChanges = function () {
    if (!currentImageProduct) return;

    const products = getProducts();

    // Update cover and sketch images
    products[currentImageProduct.key].coverImage = currentImageProduct.data.coverImage;
    products[currentImageProduct.key].sketchImage = currentImageProduct.data.sketchImage;

    // Update shop image if exists
    if (currentImageProduct.data.shopImage) {
        products[currentImageProduct.key].shopImage = currentImageProduct.data.shopImage;
    }

    saveProducts(products);

    alert('✅ Images saved successfully!\n\n' +
        '📖 To see changes in the flipbook:\n' +
        '1. Go to the flipbook (index.html)\n' +
        '2. Refresh the page (F5 or Ctrl+R)\n' +
        '3. Navigate to the product you edited\n\n' +
        'Your image changes are now live!');

    // Reload the image editor to show updated data
    loadImageEditor(currentImageProduct.key);
};
