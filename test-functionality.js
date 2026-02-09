
const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'topolina2024';

async function runTests() {
    console.log('🚀 Starting Functionality Tests...\n');
    let allPassed = true;

    // Helper for assertions
    const assert = (condition, message) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
        } else {
            console.log(`❌ FAIL: ${message}`);
            allPassed = false;
        }
    };

    try {
        // 1. Test Public Products API
        console.log('--- Testing Products API ---');
        const prodRes = await fetch(`${BASE_URL}/api/products`);
        assert(prodRes.status === 200, 'GET /api/products returns 200');
        const products = await prodRes.json();
        const productKeys = Object.keys(products);
        assert(productKeys.length > 0, `Returned ${productKeys.length} products`);

        // 2. Test Admin Login
        console.log('\n--- Testing Admin Login ---');
        const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: ADMIN_PASSWORD })
        });
        assert(loginRes.status === 200, 'Login returned 200');
        const loginData = await loginRes.json();
        assert(loginData.success === true, 'Login success is true');
        const token = loginData.token;
        assert(!!token, 'Received auth token');

        // 3. Test Order Lifecycle
        console.log('\n--- Testing Order Lifecycle ---');

        // A. Create Order
        const newOrder = {
            name: 'Test Wrapper',
            email: 'test@example.com',
            items: [{ product: 'CHEMISE', quantity: 1, patternId: 'CH1' }]
        };
        const createRes = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        });
        assert(createRes.status === 200, 'Create Order returns 200');
        const createData = await createRes.json();
        const orderId = createData.orderId;
        assert(!!orderId, `Created Order ID: ${orderId}`);

        // B. Get Orders (Admin)
        const getOrdersRes = await fetch(`${BASE_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert(getOrdersRes.status === 200, 'GET /api/orders returns 200');
        const ordersList = await getOrdersRes.json();
        const foundOrder = ordersList.find(o => o.id === orderId);
        assert(!!foundOrder, 'Verify created order exists in admin list');
        assert(foundOrder && foundOrder.status === 'pending', 'New order status is pending');

        // C. Update Order
        const updateRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'confirmed' })
        });
        assert(updateRes.status === 200, 'Update Order returns 200');

        // Verify update
        const verifyRes = await fetch(`${BASE_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyList = await verifyRes.json();
        const updatedOrder = verifyList.find(o => o.id === orderId);
        assert(updatedOrder && updatedOrder.status === 'confirmed', 'Order status updated to confirmed');

        // D. Delete Order
        const deleteRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert(deleteRes.status === 200, 'Delete Order returns 200');

        // Verify Deletion
        const finalRes = await fetch(`${BASE_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const finalList = await finalRes.json();
        const deletedOrder = finalList.find(o => o.id === orderId);
        assert(!deletedOrder, 'Order successfully removed from list');

    } catch (err) {
        console.error('❌ FATAL ERROR TEST FAILED:', err);
        allPassed = false;
    }

    console.log('\n-----------------------------------');
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED');
    } else {
        console.log('⚠️ SOME TESTS FAILED');
    }
}

runTests();
