document.addEventListener('DOMContentLoaded', async function () {

    // --- 0. GENERATE DYNAMIC PRODUCT PAGES ---
    await generateProductPages();

    // --- 1. SETUP THE BOOK ANIMATION ---
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

    window.updateQty = function (btn, fabricName, change) {
        let imgUrl = "";

        // 1. Try to find the image if we are clicking on the main grid
        try {
            let itemDiv = btn.closest('.fabric-item');
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

        // 4. Update the math
        let newQty = cart[fabricName].qty + change;
        if (newQty < 0) newQty = 0;

        cart[fabricName].qty = newQty;
        cart[fabricName].img = imgUrl;

        // 5. Update the screen
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

                // IMPORTANT: We add 'onmousedown' directly here for the new buttons
                // so they don't cause the page to flip either.
                row.innerHTML = `
                    <img src="${data.img}" class="summary-mini-img">
                    <div class="summary-details">
                        <span class="summary-name">${fabric}</span>
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
            totalRow.innerHTML = `<strong>TOTAL: ${totalQty} UNITS</strong>`;
            summaryBox.appendChild(totalRow);
        }
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
        if (!company || !name || !email || !phone || !streetAddress || !city || !postalCode || !country) {
            alert(t('msg.fillRequired'));
            return;
        }

        // Prepare order items
        let orderItems = [];
        for (let [fabric, data] of Object.entries(cart)) {
            if (data.qty > 0) {
                orderItems.push({
                    product: fabric,
                    quantity: data.qty
                });
            }
        }

        if (orderItems.length === 0) {
            alert(t('msg.selectFabric'));
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
            deliveryDate: deliveryDate,
            shippingMethod: shippingMethod,
            notes: notes,
            items: orderItems
        };

        // Submit to API
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(t('msg.orderSuccess'));
                    // Optional: Clear cart
                    cart = {};
                    syncAllVisuals();
                    // Flip to Summary or Cover?
                } else {
                    alert('Error placing order: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Network error. Please try again.');
            });
    };
});