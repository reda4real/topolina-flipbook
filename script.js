document.addEventListener('DOMContentLoaded', async function () {
    // 1. Initialize Loading Screen
    const loader = document.getElementById('loading-screen');
    const minLoadTime = 1500; // Minimum time to show logo (1.5s)
    const startTime = Date.now();

    // Hide loader function
    const hideLoader = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minLoadTime - elapsed);

        setTimeout(() => {
            if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 1000); // Remove from DOM after fade
            }
        }, remaining);
    };

    // Safety Timeout: Force hide after 5 seconds if something hangs
    setTimeout(hideLoader, 5000);

    // Initialize Theme
    ThemeManager.init();

    console.log("Starting App Initialization...");

    // --- 0. GENERATE DYNAMIC PRODUCT PAGES ---
    console.log("Starting generateProductPages()...");
    await generateProductPages();
    console.log("generateProductPages() complete.");

    // Update translations for newly generated content
    if (typeof updatePageTranslations === 'function') {
        updatePageTranslations();
    }

    hideLoader(); // Call hideLoader after all content is generated and ready
    console.log("Starting generateProductPages()...");
    await generateProductPages();
    console.log("generateProductPages() complete.");

    hideLoader(); // Call hideLoader after all content is generated and ready

    // --- 1. SETUP THE BOOK ANIMATION ---
    console.log("Initializing St.PageFlip...");
    if (typeof St === 'undefined') {
        console.error("St (PageFlip) is NOT defined. Library script might not be loaded.");
    }
    window.pageFlipInstance = new St.PageFlip(document.getElementById('book'), {
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

    // --- 0.5 AUTO-NUMBER PAGES ---
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, index) => {
        // Page 1 is index 0.
        // We want human readable numbers: 1, 2, 3...
        // Odd numbers (1, 3, 5) -> Right page -> Bottom Right
        // Even numbers (2, 4, 6) -> Left page -> Bottom Left

        const pageNum = index + 1;
        const numberDiv = document.createElement('div');
        numberDiv.className = `page-number ${pageNum % 2 === 0 ? 'left' : 'right'}`;
        numberDiv.innerText = pageNum;
        page.appendChild(numberDiv);
    });

    window.pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));


    // --- 1.5 NAVIGATION LOGIC ---
    window.flipToPage = function (pageIndex) {
        try {
            window.pageFlipInstance.flip(pageIndex - 1); // adjusting for potential 0-base
            if (window.innerWidth < 800) toggleNav();
        } catch (e) {
            console.error("Flip error:", e);
        }
    };

    window.navigateToPageId = function (elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;

        // Find index of this element among all .page elements
        const allPages = Array.from(document.querySelectorAll('.page'));
        const index = allPages.indexOf(el);

        if (index !== -1) {
            // flipToPage takes 1-based index usually, or we pass 0-based to flip()
            // Our existing flipToPage subtracts 1. So we pass index + 1.
            flipToPage(index + 1);
        }
    };

    const navSidebar = document.getElementById('nav-sidebar');
    const navToggle = document.getElementById('nav-toggle');
    let isNavOpen = false;

    window.toggleNav = function () {
        isNavOpen = !isNavOpen;
        if (isNavOpen) {
            navSidebar.classList.add('open');
            navToggle.innerHTML = "×"; // Close icon
        } else {
            navSidebar.classList.remove('open');
            navToggle.innerHTML = "☰"; // Hamburger icon
        }
    };

    navToggle.addEventListener('click', toggleNav);

    // Close sidebar when clicking outside
    document.addEventListener('click', function (event) {
        if (isNavOpen && !navSidebar.contains(event.target) && event.target !== navToggle) {
            toggleNav();
        }
    });

    // --- 2. PROTECT BUTTONS & FORM (The Real Fix) ---
    // Instead of blocking everything globally, we only stop the "Drag" signal 
    // on the specific items you touch. This lets 'click' work!

    const stopDrag = (e) => {
        e.stopPropagation(); // Stops the event from reaching the Book (no flip)
    };

    // 1. Protect all existing buttons and inputs on the page
    const interactiveItems = document.querySelectorAll('button, input, textarea, .qty-selector');
    interactiveItems.forEach(el => {
        el.addEventListener('mousedown', stopDrag);
        el.addEventListener('touchstart', stopDrag);
    });

    // 2. Protect the Order Summary container so scrolling doesn't flip pages
    const summaryBox = document.getElementById('summary-list');
    if (summaryBox) {
        summaryBox.addEventListener('mousedown', stopDrag);
        summaryBox.addEventListener('touchstart', stopDrag);
    }

    // --- 2.5 INIT CART KEYS (Fix for Add Button) ---
    // We scan all + / - buttons to find their product name and attach it to the parent .fabric-item
    // This allows syncAllVisuals to find the correct item even if the text doesn't match.
    const allQtyBtns = document.querySelectorAll('.qty-btn');
    allQtyBtns.forEach(btn => {
        const onclickText = btn.getAttribute('onclick');
        if (onclickText) {
            // onclick looks like: updateQty(this, 'CHEMISE - CH1', -1)
            const match = onclickText.match(/'([^']+)'/);
            if (match && match[1]) {
                const fabricName = match[1];
                const itemDiv = btn.closest('.fabric-item');
                if (itemDiv) {
                    itemDiv.setAttribute('data-cart-key', fabricName);
                }
            }
        }
    });


    // --- 3. SHOPPING CART LOGIC ---
    let cart = {};
    try {
        const saved = localStorage.getItem('topolina_cart');
        if (saved) cart = JSON.parse(saved);
        // Sync visually after restoring, wait for simple macro task to ensure DOM ready if needed
        setTimeout(syncAllVisuals, 0);
    } catch (e) { console.error('Cart load error', e); }

    window.updateQty = function (btn, fabricName, change) {
        let imgUrl = "";

        // 1. Try to find the image if we are clicking on the main grid
        try {
            // Case A: Clicked + / - in Grid
            let itemDiv = btn ? btn.closest('.fabric-item') : null;
            if (itemDiv) {
                let imgTag = itemDiv.querySelector('img');
                if (imgTag) imgUrl = imgTag.src;
            }
        } catch (e) { console.log(e); }

        // 2. If we are in the Summary (no image nearby), use the one saved in cart
        if ((!imgUrl || imgUrl === "") && cart[fabricName]) {
            imgUrl = cart[fabricName].img;
        }

        // 3. Initialize item if it's the first time adding it
        if (!cart[fabricName]) {
            cart[fabricName] = { qty: 0, img: imgUrl };
        }

        // --- STOCK VALIDATION START ---
        if (change > 0) {
            try {
                const parts = fabricName.split(' - ');
                if (parts.length >= 2) {
                    const productKey = parts[0];
                    const patternId = parts[1];
                    const products = getProducts(); // Global function from products-data.js

                    const product = products[productKey];
                    if (product) {
                        const pattern = product.patterns.find(p => p.id === patternId);
                        if (pattern) {
                            const currentQty = cart[fabricName].qty;
                            const nextQty = currentQty + change;
                            const stockType = pattern.stockType || 'meters';

                            if (stockType === 'quantity') {
                                const available = pattern.availableQuantity !== undefined ? pattern.availableQuantity : 0;
                                if (nextQty > available) {
                                    alert(`Stock Limit Reached!\n\nYou cannot add more of this item.\nAvailable: ${available} units\nIn Cart: ${currentQty}`);
                                    return; // Cancel update
                                }
                            } else {
                                // Meters validation
                                const availableMeters = pattern.availableMeters !== undefined ? pattern.availableMeters : 0;
                                let consumptionPerUnit = 0;
                                if (product.consumption) {
                                    if (product.consumption.entire) consumptionPerUnit = product.consumption.entire;
                                    else if (product.consumption.outside) consumptionPerUnit = product.consumption.outside;
                                }

                                const totalRequired = nextQty * consumptionPerUnit;
                                if (totalRequired > availableMeters) {
                                    alert(`Fabric Limit Reached!\n\nNot enough fabric for this quantity.\nRequired: ${totalRequired.toFixed(2)}m\nAvailable: ${availableMeters}m`);
                                    return; // Cancel update
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Stock validation warning:", err);
            }
        }
        // --- STOCK VALIDATION END ---

        // 4. Update the math
        let newQty = cart[fabricName].qty + change;
        if (newQty < 0) newQty = 0;

        cart[fabricName].qty = newQty;
        cart[fabricName].img = imgUrl;

        // 5. Update the screen
        localStorage.setItem('topolina_cart', JSON.stringify(cart));
        syncAllVisuals();
    };

    function syncAllVisuals() {
        // Update numbers on the main fabric pages
        let allItems = document.querySelectorAll('.fabric-item');
        allItems.forEach(item => {
            // NEW: Use the data attribute we set on startup
            let key = item.getAttribute('data-cart-key');

            // Fallback to text if missing (for safety)
            if (!key) {
                let nameDiv = item.querySelector('.fabric-name');
                if (nameDiv) key = nameDiv.innerText.trim();
            }

            if (key) {
                // Check if this item is in our cart
                let qtySpan = item.querySelector('.qty-val');
                if (qtySpan) {
                    if (cart[key]) {
                        qtySpan.innerText = cart[key].qty;
                    } else {
                        qtySpan.innerText = "0";
                    }
                }
            }
        });
        // Update the Order Summary page list
        renderSummary();
    }

    function renderSummary() {
        const summaryBox = document.getElementById('summary-list');
        summaryBox.innerHTML = "";

        let hasItems = false;
        let totalQty = 0;

        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) {
                hasItems = true;
                totalQty += data.qty;

                let row = document.createElement('div');
                row.className = "summary-item-row";

                // Look up price
                let priceHtml = '';
                try {
                    const products = getProducts();
                    const productKey = fabric.split(' - ')[0]; // E.g., 'CHEMISE'
                    const product = products[productKey];
                    if (product && product.priceExWorks) {
                        priceHtml = `<span class="unit-price" style="display:block; font-size:0.8rem; color:#666;">Price Ex-Works: $${product.priceExWorks}</span>`;
                    }
                } catch (e) { }

                // IMPORTANT: We add 'onmousedown' directly here for the new buttons
                // so they don't cause the page to flip either.
                row.innerHTML = `
                    <img src="${data.img}" class="summary-mini-img">
                    <div class="summary-details">
                        <span class="summary-name">${fabric}</span>
                        ${priceHtml}
                        <div class="summary-controls">
                            <button class="sm-btn" 
                                onmousedown="event.stopPropagation()" 
                                ontouchstart="event.stopPropagation()"
                                onclick="updateQty(this, '${fabric}', -1)">-</button>
                            
                            <span class="sm-val">${data.qty}</span>
                            
                            <button class="sm-btn" 
                                onmousedown="event.stopPropagation()" 
                                ontouchstart="event.stopPropagation()"
                                onclick="updateQty(this, '${fabric}', 1)">+</button>

                            <button class="sm-btn-remove" 
                                onmousedown="event.stopPropagation()" 
                                ontouchstart="event.stopPropagation()"
                                onclick="removeFromCart('${fabric}')"
                                title="Remove Item">×</button>
                        </div>
                    </div>
                `;
                summaryBox.appendChild(row);
            }
        }

        if (!hasItems) {
            summaryBox.innerHTML = '<p style="color:#ccc; text-align:center; margin-top:80px;">No items selected</p>';
        } else {
            let totalRow = document.createElement('div');
            totalRow.style.marginTop = "15px";
            totalRow.style.textAlign = "right";
            totalRow.style.borderTop = "2px solid #000";
            totalRow.style.paddingTop = "10px";
            totalRow.innerHTML = `
                <strong>TOTAL: ${totalQty} UNITS</strong>
                <div style="margin-top: 10px;">
                    <button class="submit-btn" style="background-color: #4CAF50; padding: 8px 15px; font-size: 0.7rem;" onclick="downloadPDF()">
                        📥 Download Order PDF
                    </button>
                </div>
            `;
            summaryBox.appendChild(totalRow);
        }
    }

    // --- 6. PDF DOWNLOAD LOGIC ---
    window.downloadPDF = async function () {
        if (!window.jspdf) {
            alert("PDF Library (jsPDF) is not loaded. Please check your internet connection and refresh the page.");
            console.error("window.jspdf is undefined");
            return;
        }

        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert("PDF Library loaded but jsPDF constructor not found.");
            return;
        }

        const doc = new jsPDF();

        // Validate fields to highlight missing ones (but don't block download)
        validateFormFields();

        // Helper to load image as Base64
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    try {
                        resolve(canvas.toDataURL('image/jpeg'));
                    } catch (e) {
                        console.warn("Canvas export failed", e);
                        resolve(null);
                    }
                };
                img.onerror = () => {
                    console.warn("Image load failed", src);
                    resolve(null);
                };
                img.src = src;
            });
        };

        // Header
        doc.setFontSize(20);
        doc.text("Topolina Order Summary", 105, 20, null, null, "center");

        doc.setFontSize(12);
        const today = new Date().toLocaleDateString();
        doc.text(`Date: ${today}`, 20, 30);

        // Client Info (if filled)
        const company = document.getElementById('company').value || "N/A";
        const name = document.getElementById('name').value || "N/A";
        doc.text(`Company: ${company}`, 20, 40);
        doc.text(`Contact: ${name}`, 20, 46);

        // Line
        doc.line(20, 50, 190, 50);

        // Table Header
        let y = 60;
        doc.setFontSize(10);
        doc.text("Pattern", 20, y);       // New Column
        doc.text("Product Info", 50, y); // Shifted
        doc.text("Price EX-WORKS", 110, y);
        doc.text("Total", 135, y);
        doc.text("Qty", 160, y);

        y += 5;
        doc.line(20, y, 190, y);
        y += 10;

        // Items
        let total = 0;
        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) {
                // Check for page break
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                // Add Image
                if (data.img) {
                    const imgData = await loadImage(data.img);
                    if (imgData) {
                        // x=20, y=y, w=20, h=20
                        doc.addImage(imgData, 'JPEG', 20, y - 5, 20, 20);
                    }
                }

                // Add Text
                doc.text(fabric, 50, y + 5);

                // Add Price
                try {
                    console.log(`Processing PDF item: ${fabric}`);
                    const products = getProducts();
                    const productKey = fabric.split(' - ')[0];
                    const product = products[productKey];

                    if (product && product.priceExWorks) {
                        const unitPrice = parseFloat(product.priceExWorks);
                        const lineTotal = unitPrice * data.qty;

                        doc.text(`$${unitPrice.toFixed(2)}`, 110, y + 5);
                        doc.text(`$${lineTotal.toFixed(2)}`, 135, y + 5);
                    } else {
                        doc.text("-", 110, y + 5);
                        doc.text("-", 135, y + 5);
                    }
                } catch (e) {
                    console.error("PDF Price Error", e);
                    doc.text("-", 110, y + 5);
                }

                doc.text(String(data.qty), 160, y + 5);

                total += data.qty;
                y += 25; // More vertical space for images
            }
        }

        // Final Line if we are not at bottom
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        // Total
        doc.line(20, y, 190, y);
        y += 10;
        doc.setFontSize(12);

        // Calculate Grand Total
        let grandTotal = 0;
        try {
            const products = getProducts();
            for (let [fabric, data] of Object.entries(cart)) {
                if (data.qty > 0) {
                    const productKey = fabric.split(' - ')[0];
                    const product = products[productKey];
                    if (product && product.priceExWorks) {
                        grandTotal += (parseFloat(product.priceExWorks) * data.qty);
                    }
                }
            }
        } catch (e) { console.error("Grand total calc error", e); }

        doc.text(`GRAND TOTAL: $${grandTotal.toFixed(2)}`, 110, y);
        doc.text(`TOTAL UNITS: ${total}`, 160, y);


        // Footer
        doc.setFontSize(10);
        doc.text("Please email this summary to confirm your order.", 105, 285, null, null, "center");

        // Check if we have items
        let hasItems = false;
        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) hasItems = true;
        }

        // --- FORCE DOWNLOAD WITH CORRECT FILENAME ---
        try {
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Topolina_Order.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Blob download failed, falling back to doc.save", err);
            doc.save("Topolina_Order.pdf");
        }
    };


    // New Function to Remove Item
    window.removeFromCart = function (fabricName) {
        if (cart[fabricName]) {
            delete cart[fabricName];
        }

        localStorage.setItem('topolina_cart', JSON.stringify(cart));
        syncAllVisuals();
    };




    // --- 5. ZOOM / LIGHTBOX LOGIC ---

    // --- 5. ENHANCED LIGHTBOX LOGIC ---
    let currentLightboxItem = null; // { productKey, patternId, cartKey }

    window.openPatternLightbox = function (productKey, patternId) {
        const products = getProducts();
        const product = products[productKey];
        if (!product) return;

        const pattern = product.patterns.find(p => p.id === patternId);
        if (!pattern) return;

        // 1. Details
        currentLightboxItem = {
            productKey,
            patternId,
            cartKey: `${productKey} - ${pattern.id}` // Must match format in dynamic-pages.js
        };

        const modal = document.getElementById("patternLightbox");
        document.getElementById("lb-pattern-img").src = pattern.image;
        document.getElementById("lb-pattern-name").innerText = pattern.name;
        document.getElementById("lb-pattern-id").innerText = `ID: ${pattern.id}`;

        // 2. Stock Logic (Reuse logic from updateQty)
        updateLightboxStockDisplay(product, pattern);

        // 3. Current Cart Quantity
        const currentQty = cart[currentLightboxItem.cartKey] ? cart[currentLightboxItem.cartKey].qty : 0;
        updateLightboxQtyDisplay(currentQty);

        // 4. Show Modal
        modal.style.display = "block";
    };

    function updateLightboxStockDisplay(product, pattern) {
        const statusEl = document.getElementById("lb-stock-status");
        const detailEl = document.getElementById("lb-stock-detail");

        statusEl.className = ""; // Reset classes

        const stockType = pattern.stockType || 'meters';
        let isAvailable = true;
        let message = "";
        let details = "";

        if (stockType === 'quantity') {
            // Unit Stock
            const qty = pattern.availableQuantity !== undefined ? pattern.availableQuantity : 0;
            if (qty <= 0) {
                statusEl.innerText = "OUT OF STOCK";
                statusEl.classList.add("status-out-of-stock");
                isAvailable = false;
            } else if (qty < 10) {
                statusEl.innerText = "LOW STOCK";
                statusEl.classList.add("status-low-stock");
                details = `Only ${qty} units available`;
            } else {
                statusEl.innerText = "IN STOCK";
                statusEl.classList.add("status-in-stock");
                details = `${qty} units ready to ship`;
            }
        } else {
            // Fabric Meters
            const meters = pattern.availableMeters !== undefined ? pattern.availableMeters : 0;
            if (meters <= 0) {
                statusEl.innerText = "OUT OF STOCK";
                statusEl.classList.add("status-out-of-stock");
                isAvailable = false;
            } else if (meters < 20) {
                statusEl.innerText = "LOW STOCK";
                statusEl.classList.add("status-low-stock");
                details = `Only ${meters.toFixed(1)}m fabric remaining`;
            } else {
                statusEl.innerText = "IN STOCK";
                statusEl.classList.add("status-in-stock");
                details = `${meters.toFixed(1)}m fabric available`;
            }
        }

        detailEl.innerText = details;

        // Disable buttons if out of stock
        document.getElementById('lb-qty-plus').disabled = !isAvailable;
        document.getElementById('lb-qty-minus').disabled = !isAvailable;
    }

    function updateLightboxQtyDisplay(qty) {
        document.getElementById("lb-qty-val").innerText = qty;
    }

    // Lightbox Controls
    document.getElementById('lb-qty-plus').onclick = function () {
        if (!currentLightboxItem) return;
        // Reuse global updateQty
        // Logic: updateQty(btn, fabricName, change)
        // We pass 'null' as btn because we're not in the grid, but updateQty handles it fine (just won't find image from DOM, looks in cart)
        // Wait! updateQty needs to find the image URL if it's new.
        // Let's manually ensure cart has image if it's 0.

        // Use cart key
        const cartKey = currentLightboxItem.cartKey;

        // Pre-fill image if needed so updateQty doesn't fail to find it
        if (!cart[cartKey]) {
            const imgSrc = document.getElementById("lb-pattern-img").src;
            cart[cartKey] = { qty: 0, img: imgSrc };
        }

        // Call standard update
        updateQty(null, cartKey, 1);

        // Update our display
        updateLightboxQtyDisplay(cart[cartKey].qty);
    };

    document.getElementById('lb-qty-minus').onclick = function () {
        if (!currentLightboxItem) return;
        const cartKey = currentLightboxItem.cartKey;

        // Call standard update
        updateQty(null, cartKey, -1);

        // Update our display
        const newQty = cart[cartKey] ? cart[cartKey].qty : 0;
        updateLightboxQtyDisplay(newQty);
    };

    // Close Lightbox
    const lbModal = document.getElementById("patternLightbox");
    const lbClose = document.querySelector("#patternLightbox .lightbox-close");

    if (lbClose) {
        lbClose.onclick = () => { lbModal.style.display = "none"; };
    }

    if (lbModal) {
        lbModal.onclick = (e) => {
            if (e.target === lbModal) lbModal.style.display = "none";
        };
    }

    // --- 4. SEND EMAIL LOGIC ---
    window.sendOrder = function () {
        // Business Information
        const company = document.getElementById('company').value;
        const name = document.getElementById('name').value;
        const taxId = document.getElementById('taxId').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        // Shipping Address
        const streetAddress = document.getElementById('streetAddress').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const postalCode = document.getElementById('postalCode').value;
        const country = document.getElementById('country').value;

        // Notes
        const notes = document.getElementById('notes').value;

        // Validation - Check required fields
        if (!validateFormFields()) {
            alert(t('msg.fillRequired'));
            return;
        }

        // Prepare order items
        let orderItems = [];
        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) {
                orderItems.push({
                    product: fabric,
                    quantity: data.qty,
                    image: data.img
                });
            }
        }

        if (orderItems.length === 0) {
            alert(t('msg.selectFabric'));
            return;
        }

        // Check Stock Availability
        const products = getProducts();
        let insufficientStockItems = [];

        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) {
                // Parse "PRODUCT - PATTERN" key
                const parts = fabric.split(' - ');
                if (parts.length < 2) continue;

                const productKey = parts[0];
                const patternId = parts[1]; // Wait, pattern NAME is usually used here?
                // Let's check how cart keys are constructed: `${productKey} - ${pattern.id}` (from createPatternHTML)
                // BUT wait, in createPatternHTML we use pattern.id now. previously it might have been pattern.name?
                // `const cartKey = `${productKey} - ${pattern.id}`;` -> Correct.

                const product = products[productKey];
                if (product) {
                    const pattern = product.patterns.find(p => p.id === patternId);
                    if (pattern) {
                        const stockType = pattern.stockType || 'meters';

                        if (stockType === 'quantity') {
                            const available = pattern.availableQuantity !== undefined ? pattern.availableQuantity : 0;
                            if (data.qty > available) {
                                insufficientStockItems.push(`${fabric} (Requested: ${data.qty}, Available: ${available})`);
                            }
                        } else {
                            const availableMeters = pattern.availableMeters !== undefined ? pattern.availableMeters : 0;
                            let consumptionPerUnit = 0;

                            if (product.consumption) {
                                if (product.consumption.entire) {
                                    consumptionPerUnit = product.consumption.entire;
                                } else if (product.consumption.outside) {
                                    consumptionPerUnit = product.consumption.outside;
                                }
                            }

                            const totalRequired = data.qty * consumptionPerUnit;
                            if (totalRequired > availableMeters) {
                                insufficientStockItems.push(`${fabric} (Requested: ${totalRequired.toFixed(2)}m, Available: ${availableMeters}m)`);
                            }
                        }
                    }
                }
            }
        }

        if (insufficientStockItems.length > 0) {
            alert(t('msg.outOfStock') + '\n\n' + insufficientStockItems.join('\n'));
            return;
        }

        // Create order object for admin panel

        const order = {
            id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            status: 'pending',
            // Business Info
            company: company,
            contactPerson: name,
            taxId: taxId,
            email: email,
            phone: phone,
            // Shipping Address
            streetAddress: streetAddress,
            city: city,
            state: state,
            postalCode: postalCode,
            country: country,
            // Delivery
            notes: notes,
            items: orderItems
        };

        // Submit to API
        fetch('api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        })
            .then(async response => {
                const data = await response.json();

                if (response.ok && data.success) {
                    alert(t('msg.orderSuccess'));

                    // Clear cart
                    localStorage.removeItem('topolina_cart');
                    cart = {};

                    // Refresh to show updated stock and clear UI
                    window.location.reload();
                } else {
                    // Show error message from server (e.g., insufficient stock)
                    alert(data.error || 'Error placing order');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Network error. Please try again.');
            });
    };

    // --- 7. HELPER: FORM VALIDATION ---
    function validateFormFields() {
        const requiredIds = [
            'company', 'name', 'email', 'phone',
            'streetAddress', 'city', 'postalCode', 'country'
        ];

        let isValid = true;

        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // Remove error on input if not already bound
            if (!el.hasAttribute('data-validation-bound')) {
                el.addEventListener('input', () => {
                    if (el.value.trim() !== '') {
                        el.classList.remove('input-error');
                    }
                });
                el.setAttribute('data-validation-bound', 'true');
            }

            if (el.value.trim() === '') {
                el.classList.add('input-error');
                isValid = false;
            } else {
                el.classList.remove('input-error');
            }
        });

        return isValid;
    }
});