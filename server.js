require('dotenv').config();
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
console.log('--- Topolina Server v3.5 Starting ---');

// Middleware
const APP_URL = process.env.APP_URL || '*';
app.use(cors({ origin: APP_URL }));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images within JSON if any
app.use(express.urlencoded({ extended: true }));

// --- SECURITY MIDDLEWARE ---

// 1. Block access to sensitive server files
app.use((req, res, next) => {
    const sensitiveFiles = ['server.js', 'database.js', 'flipbook.db', 'package.json', 'package-lock.json', 'README.md', '.env'];
    if (sensitiveFiles.some(file => req.url.includes(file))) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// 2. Simple Admin Auth Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'topolina2024';

const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Simple "Bearer topolina2024" or just checking a custom header for now
    // Since our admin.js just set "session: active", we need to update admin.js to send the password/token
    // For now, let's update login to return a token (the password itself for simplicity in this no-env setup)

    if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Serve static files (AFTER security check)
// Serve from root AND /wholesale for subdirectory deployment
app.use(express.static(__dirname));
app.use('/wholesale', express.static(__dirname));


// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-sanitized_original_name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- API ROUTES (Router) ---
const apiRouter = express.Router();

// Login
apiRouter.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // Return the password as the token for this simple setup
        res.json({ success: true, token: ADMIN_PASSWORD });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// GET Products (Public) - RECONSTRUCT FOR FRONTEND
apiRouter.get('/products', async (req, res) => {
    try {
        // Use Promise.all for parallel fetching
        const [products, patterns, fabrics] = await Promise.all([
            db.query('SELECT * FROM products'),
            db.query('SELECT * FROM patterns'),
            db.query('SELECT * FROM fabrics')
        ]);

        // Create Fabric Map
        const fabricMap = {};
        for (const f of fabrics) {
            fabricMap[f.id] = f;
        }

        // Reconstruct Object Map
        const productsMap = {};

        for (const p of products) {
            productsMap[p.id] = {
                displayName: p.display_name,
                consumption: {
                    entire: p.consumption_entire || undefined,
                    outside: p.consumption_outside || undefined,
                    inside: p.consumption_inside || undefined
                },
                coverImage: p.cover_image,
                sketchImage: p.sketch_image,
                shopImage: p.shop_image,
                priceExWorks: p.price_ex_works,
                priceLanded: p.price_landed,
                priceRetail: p.price_retail,
                patterns: []
            };
        }

        for (const pat of patterns) {
            if (productsMap[pat.product_id]) {
                let availableMeters = pat.available_meters;

                // If linked to fabric, use fabric's stock
                if (pat.fabric_id && fabricMap[pat.fabric_id]) {
                    availableMeters = fabricMap[pat.fabric_id].availableMeters;
                }

                productsMap[pat.product_id].patterns.push({
                    id: pat.id,
                    name: pat.name,
                    image: pat.image,
                    fabricId: pat.fabric_id,
                    stockType: pat.stock_type,
                    availableMeters: availableMeters,
                    availableQuantity: pat.available_quantity
                });
            }
        }

        if (Object.keys(productsMap).length === 0) {
            return res.json({});
        }

        res.json(productsMap);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// UPDATE Product (Protected) - DISTRIBUTE TO TABLES
apiRouter.post('/products', requireAdmin, async (req, res) => {
    const productsInput = req.body;
    // Input is a map: { "CHEMISE": { ...data... }, ... }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const productKeys = Object.keys(productsInput);

        for (const key of productKeys) {
            const data = productsInput[key];

            // 1. Update/Insert Product
            const consumption = data.consumption || {};

            // Check existence
            const [existing] = await connection.query('SELECT id FROM products WHERE id = ?', [key]);

            if (existing.length > 0) {
                await connection.query(`UPDATE products SET 
                    display_name=?, consumption_entire=?, consumption_outside=?, consumption_inside=?,
                    cover_image=?, sketch_image=?, shop_image=?,
                    price_ex_works=?, price_landed=?, price_retail=?
                    WHERE id=?`, [
                    data.displayName,
                    consumption.entire || null, consumption.outside || null, consumption.inside || null,
                    data.coverImage, data.sketchImage, data.shopImage,
                    data.priceExWorks, data.priceLanded, data.priceRetail,
                    key
                ]);
            } else {
                await connection.query(`INSERT INTO products (
                    id, display_name, consumption_entire, consumption_outside, consumption_inside,
                    cover_image, sketch_image, shop_image,
                    price_ex_works, price_landed, price_retail
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    key,
                    data.displayName,
                    consumption.entire || null, consumption.outside || null, consumption.inside || null,
                    data.coverImage, data.sketchImage, data.shopImage,
                    data.priceExWorks, data.priceLanded, data.priceRetail
                ]);
            }

            // 2. Handle Patterns
            // Strategy: Get existing pattern IDs, compare with new list.
            // Delete missing, Update existing, Insert new.

            const [existingPatterns] = await connection.query('SELECT id FROM patterns WHERE product_id = ?', [key]);
            const existingIds = new Set(existingPatterns.map(p => p.id));
            const newIds = new Set();

            if (data.patterns && Array.isArray(data.patterns)) {
                for (const p of data.patterns) {
                    newIds.add(p.id);

                    if (existingIds.has(p.id)) {
                        await connection.query(`UPDATE patterns SET 
                            name=?, image=?, fabric_id=?, stock_type=?, available_meters=?, available_quantity=?
                            WHERE product_id=? AND id=?`, [
                            p.name, p.image, p.fabricId, p.stockType || 'meters', p.availableMeters || 0, p.availableQuantity || 0,
                            key, p.id
                        ]);
                    } else {
                        await connection.query(`INSERT INTO patterns (
                            id, product_id, name, image, fabric_id, stock_type, available_meters, available_quantity
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                            p.id, key, p.name, p.image, p.fabricId, p.stockType || 'meters', p.availableMeters || 0, p.availableQuantity || 0
                        ]);
                    }
                }
            }

            // Delete removed patterns
            for (const oldId of existingIds) {
                if (!newIds.has(oldId)) {
                    await connection.query('DELETE FROM patterns WHERE product_id=? AND id=?', [key, oldId]);
                }
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to save products' });
    } finally {
        connection.release();
    }
});

// GET Orders (Protected)
apiRouter.get('/orders', requireAdmin, async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        const orders = rows.map(row => {
            const obj = JSON.parse(row.data);
            obj.status = row.status; // Ensure status is synced
            return obj;
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE Order (Public) with Inventory Check - UPDATED FOR SCHEMA
apiRouter.post('/orders', async (req, res) => {
    const order = req.body;
    const id = order.id || `ORD-${Date.now()}`;
    const status = order.status || 'pending';
    const timestamp = order.timestamp || Date.now();

    order.id = id;
    order.status = status;
    order.timestamp = timestamp;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const insufficientStockItems = [];

        for (const item of order.items) {
            const parts = item.product.split(' - ');
            if (parts.length < 2) continue;

            const productKey = parts[0];
            const patternId = parts[1];

            // Lock pattern row
            const [patternRows] = await connection.query(
                'SELECT * FROM patterns WHERE product_id = ? AND id = ? FOR UPDATE',
                [productKey, patternId]
            );

            if (patternRows.length === 0) continue;
            let pattern = patternRows[0];

            // Get product consumption
            const [productRows] = await connection.query(
                'SELECT consumption_entire, consumption_outside FROM products WHERE id = ?',
                [productKey]
            );

            if (productRows.length === 0) continue;
            const product = productRows[0];


            // --- VALIDATION & DEDUCTION ---
            const stockType = pattern.stock_type || 'meters';
            const requestedQty = parseInt(item.quantity) || 0;

            if (stockType === 'quantity') {
                const available = pattern.available_quantity;
                if (requestedQty > available) {
                    insufficientStockItems.push(`${item.product} (Requested: ${requestedQty}, Available: ${available})`);
                } else {
                    await connection.query(
                        'UPDATE patterns SET available_quantity = available_quantity - ? WHERE product_id=? AND id=?',
                        [requestedQty, productKey, patternId]
                    );
                }
            } else {
                // Fabric (Meters)
                let consumptionPerUnit = 0;
                if (product.consumption_entire) {
                    consumptionPerUnit = product.consumption_entire;
                } else if (product.consumption_outside) {
                    consumptionPerUnit = product.consumption_outside;
                }

                const totalRequired = requestedQty * consumptionPerUnit;

                // CHECK LINKED FABRIC
                if (pattern.fabric_id) {
                    // Lock fabric row
                    const [fabricRows] = await connection.query(
                        'SELECT * FROM fabrics WHERE id = ? FOR UPDATE',
                        [pattern.fabric_id]
                    );

                    if (fabricRows.length > 0) {
                        const fabric = fabricRows[0];
                        const availableMeters = fabric.availableMeters;

                        if (totalRequired > availableMeters) {
                            insufficientStockItems.push(`${item.product} (Shared Fabric: ${fabric.name}, Requested: ${totalRequired.toFixed(2)}m, Available: ${availableMeters.toFixed(2)}m)`);
                        } else {
                            await connection.query(
                                'UPDATE fabrics SET availableMeters = availableMeters - ? WHERE id=?',
                                [totalRequired, pattern.fabric_id]
                            );
                        }
                    } else {
                        // Fabric not found, fallback or error? Let's treat as error to be safe
                        insufficientStockItems.push(`${item.product} (Linked Fabric ID ${pattern.fabric_id} not found)`);
                    }

                } else {
                    // Standard Pattern Stock
                    const availableMeters = pattern.available_meters;

                    if (totalRequired > availableMeters) {
                        insufficientStockItems.push(`${item.product} (Requested: ${totalRequired.toFixed(2)}m, Available: ${availableMeters.toFixed(2)}m)`);
                    } else {
                        await connection.query(
                            'UPDATE patterns SET available_meters = available_meters - ? WHERE product_id=? AND id=?',
                            [totalRequired, productKey, patternId]
                        );
                    }
                }
            }
        }

        if (insufficientStockItems.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                error: 'Insufficient stock for the following items:\n' + insufficientStockItems.join('\n')
            });
        }

        // 2. Insert Order
        await connection.query('INSERT INTO orders (id, data, status, created_at) VALUES (?, ?, ?, ?)',
            [id, JSON.stringify(order), status, timestamp]);

        await connection.commit();
        res.json({ success: true, orderId: id });

    } catch (err) {
        await connection.rollback();
        console.error("Order Transaction Error:", err);
        res.status(500).json({ error: 'Failed to process order. ' + err.message });
    } finally {
        connection.release();
    }
});

// UPDATE Order (Protected)
apiRouter.put('/orders/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, data } = req.body; // Expecting { status: 'confirmed' } etc.

    try {
        const row = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!row) return res.status(404).json({ error: 'Order not found' });

        let currentData = JSON.parse(row.data);

        if (status) {
            currentData.status = status;
            await db.run('UPDATE orders SET status = ?, data = ? WHERE id = ?', [status, JSON.stringify(currentData), id]);
        }

        // If full data update is provided (optional)
        if (data) {
            await db.run('UPDATE orders SET data = ? WHERE id = ?', [JSON.stringify(data), id]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE Order (Protected)
apiRouter.delete('/orders/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM orders WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- FABRIC MANAGEMENT ---

// GET Fabrics
apiRouter.get('/fabrics', async (req, res) => {
    try {
        const fabrics = await db.query('SELECT * FROM fabrics');
        res.json(fabrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE Fabric
apiRouter.post('/fabrics', requireAdmin, async (req, res) => {
    const { name, availableMeters } = req.body;
    const id = `FAB-${Date.now()}`;
    try {
        await db.run('INSERT INTO fabrics (id, name, availableMeters) VALUES (?, ?, ?)', [id, name, availableMeters || 0]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Fabric
apiRouter.put('/fabrics/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, availableMeters } = req.body;
    try {
        await db.run('UPDATE fabrics SET name = ?, availableMeters = ? WHERE id = ?', [name, availableMeters, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE Fabric
apiRouter.delete('/fabrics/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Optional: specific check if patterns are linked?
        // For now, let's assume we just unlink them or let them hang (migrations safer to unlink)
        // Better to set their fabric_id to NULL
        await db.run('UPDATE patterns SET fabric_id = NULL WHERE fabric_id = ?', [id]);

        await db.run('DELETE FROM fabrics WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LINK Pattern to Fabric
apiRouter.post('/products/:productId/patterns/:patternId/fabric', requireAdmin, async (req, res) => {
    const { productId, patternId } = req.params;
    const { fabricId } = req.body;
    try {
        await db.run('UPDATE patterns SET fabric_id = ? WHERE product_id = ? AND id = ?', [fabricId, productId, patternId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UNLINK Pattern from Fabric
apiRouter.delete('/products/:productId/patterns/:patternId/fabric', requireAdmin, async (req, res) => {
    const { productId, patternId } = req.params;
    try {
        await db.run('UPDATE patterns SET fabric_id = NULL WHERE product_id = ? AND id = ?', [productId, patternId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Image Upload (Protected)
apiRouter.post('/upload', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the path relative to the server root
    const relativePath = 'uploads/' + req.file.filename;
    res.json({
        success: true,
        filepath: relativePath
    });
});


// Mount API Router on root AND /wholesale
app.use('/api', apiRouter);
app.use('/wholesale/api', apiRouter);


// --- INITIALIZATION ---

// Easy Admin Route (served from root)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Easy Admin Route (served from /wholesale/admin)
app.get('/wholesale/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Seeding logic (Simplified for new Schema: Only checks if products table is empty)
const seedProducts = async () => {
    const hasProducts = await db.get('SELECT 1 FROM products LIMIT 1');
    if (!hasProducts) {
        console.log('Database empty. Please run migrate_schema.js or import SQL to populate.');
    }
}

// Start Server
db.init().then(() => {
    seedProducts().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            if (process.env.APP_URL) console.log(`Configured APP_URL: ${process.env.APP_URL}`);
        });
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
