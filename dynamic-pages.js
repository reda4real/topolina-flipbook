// Dynamic Product Page Generator for Flipbook
// This script dynamically generates product pages from localStorage data

async function generateProductPages() {
    // Ensure we have products
    let products = getProducts();
    if (Object.keys(products).length === 0) {
        products = await fetchProducts();
    }
    const bookContainer = document.getElementById('book');

    if (!bookContainer) {
        console.error('Book container not found');
        return;
    }

    // Clear existing product pages (keep cover and static pages)
    const existingPages = bookContainer.querySelectorAll('.page.dynamic-product-page');
    existingPages.forEach(page => page.remove());

    // Find the cover page to insert after it
    const coverPage = bookContainer.querySelector('.page.cover-page');
    let insertAfter = coverPage;

    // Track page numbers for navigation
    let currentPageNumber = 2; // Start after cover (page 1)
    window.productNavigationMap = {}; // Store product -> sketch page mapping

    // Generate pages for each product
    Object.entries(products).forEach(([productKey, productData]) => {
        // Create cover page for product
        const coverPageEl = createProductCoverPage(productData);
        insertAfter.after(coverPageEl);
        insertAfter = coverPageEl;
        currentPageNumber++;

        // Create sketch page for product - THIS IS WHERE NAVIGATION SHOULD GO
        const sketchPageEl = createProductSketchPage(productData);
        insertAfter.after(sketchPageEl);
        insertAfter = sketchPageEl;

        // Store the sketch page number for navigation
        window.productNavigationMap[productKey] = currentPageNumber;
        currentPageNumber++;

        // Create pattern pages for product
        const patternPages = createProductPatternPages(productKey, productData);
        patternPages.forEach(pageEl => {
            insertAfter.after(pageEl);
            insertAfter = pageEl;
            currentPageNumber++;
        });

        // Add shop image page after some products (if exists)
        const shopPageEl = createShopPage(productKey);
        if (shopPageEl) {
            insertAfter.after(shopPageEl);
            insertAfter = shopPageEl;
            currentPageNumber++;
        }
    });

    // Update navigation links
    updateNavigationLinks();
}

function createProductCoverPage(productData) {
    const page = document.createElement('div');
    page.className = 'page dynamic-product-page';
    page.innerHTML = `
        <div class="page-content no-padding">
            <img src="${productData.coverImage}" class="full-page-img" alt="${productData.displayName} Cover">
        </div>
    `;
    return page;
}

function createProductSketchPage(productData) {
    const page = document.createElement('div');
    page.className = 'page dynamic-product-page';
    page.innerHTML = `
        <div class="page-content no-padding">
            <img src="${productData.sketchImage}" class="full-page-img" alt="${productData.displayName} Sketch">
        </div>
    `;
    return page;
}

function createProductPatternPages(productKey, productData) {
    const pages = [];
    const patternsPerPage = 12; // Adjust based on your layout
    const patterns = productData.patterns || [];

    for (let i = 0; i < patterns.length; i += patternsPerPage) {
        const pagePatterns = patterns.slice(i, i + patternsPerPage);
        const page = document.createElement('div');
        page.className = 'page dynamic-product-page';

        const startNum = i + 1;
        const endNum = Math.min(i + patternsPerPage, patterns.length);
        const rangeText = patterns.length > patternsPerPage ?
            `Patterns ${startNum} - ${endNum}` :
            `${patterns.length} Patterns`;

        page.innerHTML = `
            <div class="page-content">
                <div class="header-section">
                    <h2>${productData.displayName}</h2>
                    <p>${rangeText}</p>
                </div>
                <div class="fabric-grid">
                    ${pagePatterns.map(pattern => createPatternHTML(productKey, pattern)).join('')}
                </div>
            </div>
        `;
        pages.push(page);
    }

    return pages;
}

function createPatternHTML(productKey, pattern) {
    const cartKey = `${productKey} - ${pattern.id}`;
    const borderStyle = pattern.id === 'WHITE' ? 'style="border:1px solid #ddd;"' : '';

    return `
        <div class="fabric-item" data-cart-key="${cartKey}">
            <img src="${pattern.image}" class="swatch-img" ${borderStyle} alt="${pattern.name}">
            <div class="fabric-name">${pattern.name}</div>
            <div class="qty-selector">
                <button class="qty-btn" onclick="updateQty(this, '${cartKey}', -1)">-</button>
                <span class="qty-val">0</span>
                <button class="qty-btn" onclick="updateQty(this, '${cartKey}', 1)">+</button>
            </div>
        </div>
    `;
}

function createShopPage(productKey) {
    // Get products to check for custom shop image
    const products = getProducts();
    const product = products[productKey];

    // Use custom shop image if available
    if (product && product.shopImage) {
        const page = document.createElement('div');
        page.className = 'page dynamic-product-page';
        page.innerHTML = `
            <div class="page-content no-padding">
                <img src="${product.shopImage}" class="full-page-img" alt="Shop">
            </div>
        `;
        return page;
    }

    // Fallback to default shop images
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

    if (shopImages[productKey]) {
        const page = document.createElement('div');
        page.className = 'page dynamic-product-page';
        page.innerHTML = `
            <div class="page-content no-padding">
                <img src="${shopImages[productKey]}" class="full-page-img" alt="Shop">
            </div>
        `;
        return page;
    }
    return null;
}

// Listen for product updates from admin panel
window.addEventListener('storage', function (e) {
    if (e.key === 'topolina_products') {
        console.log('Products updated, reloading flipbook...');
        reloadFlipbook();
    }
});

// Also listen for custom event (for same-window updates)
window.addEventListener('productsUpdated', function () {
    console.log('Products updated, reloading flipbook...');
    reloadFlipbook();
});

function reloadFlipbook() {
    // Regenerate product pages
    generateProductPages();

    // Reinitialize the flipbook
    const bookContainer = document.getElementById('book');
    const pages = bookContainer.querySelectorAll('.page');

    // Re-number pages
    pages.forEach((page, index) => {
        // Remove old page number
        const oldNumber = page.querySelector('.page-number');
        if (oldNumber) oldNumber.remove();

        // Add new page number
        const pageNum = index + 1;
        const numberDiv = document.createElement('div');
        numberDiv.className = `page-number ${pageNum % 2 === 0 ? 'left' : 'right'}`;
        numberDiv.innerText = pageNum;
        page.appendChild(numberDiv);
    });

    // Reload the page flip library
    if (window.pageFlipInstance) {
        window.pageFlipInstance.destroy();
    }

    window.pageFlipInstance = new St.PageFlip(bookContainer, {
        width: 260,
        height: 400,
        size: "stretch",
        minWidth: 200,
        maxWidth: 600,
        minHeight: 300,
        maxHeight: 900,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false
    });

    window.pageFlipInstance.loadFromHTML(pages);

    // Reattach event protection
    attachEventProtection();
}

function attachEventProtection() {
    const stopDrag = (e) => {
        e.stopPropagation();
    };

    const interactiveItems = document.querySelectorAll('button, input, textarea, .qty-selector');
    interactiveItems.forEach(el => {
        el.addEventListener('mousedown', stopDrag);
        el.addEventListener('touchstart', stopDrag);
    });

    const summaryBox = document.getElementById('summary-list');
    if (summaryBox) {
        summaryBox.addEventListener('mousedown', stopDrag);
        summaryBox.addEventListener('touchstart', stopDrag);
    }
}

// Update navigation links to point to sketch pages
function updateNavigationLinks() {
    if (!window.productNavigationMap) return;

    // Map navigation items to product keys
    const navMapping = {
        'nav.chemise': 'CHEMISE',
        'nav.pontalon': 'PONTALON',
        'nav.chemiseSansManche': 'SANT MANCH',
        'nav.jupe': 'JUPE',
        'nav.manteauDroit': 'MANTEAU DROIT',
        'nav.robeEsabel': 'ROBE ESABEL',
        'nav.topEsabel': 'TOP ESABEL',
        'nav.manteau34': 'MANTEAU 3/4',
        'nav.manteauLong': 'MANTEAU LONG',
        'nav.vest': 'VEST',
        'nav.robeLong': 'ROBE LONG'
    };

    // Update each navigation link
    Object.entries(navMapping).forEach(([dataI18n, productKey]) => {
        const navItem = document.querySelector(`[data-i18n="${dataI18n}"]`);
        if (navItem && window.productNavigationMap[productKey]) {
            const pageNumber = window.productNavigationMap[productKey];
            navItem.setAttribute('onclick', `flipToPage(${pageNumber})`);
            console.log(`Updated ${productKey} navigation to page ${pageNumber}`);
        }
    });
}
