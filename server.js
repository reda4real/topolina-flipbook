require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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
app.use(express.static(__dirname));

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

// --- API ROUTES ---

// Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // Return the password as the token for this simple setup
        res.json({ success: true, token: ADMIN_PASSWORD });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// GET Products (Public)
app.get('/api/products', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM products');
        const productsMap = {};

        if (rows.length === 0) {
            // If DB is empty, return empty (or we could trigger seed here)
            // But main seeding happens on server start
            return res.json({});
        }

        rows.forEach(row => {
            productsMap[row.id] = JSON.parse(row.data);
        });
        res.json(productsMap);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// UPDATE Product (Protected)
app.post('/api/products', requireAdmin, async (req, res) => {
    const products = req.body;
    // We expect the whole products map or a single key update?
    // Let's assume the admin sends the ENTIRE map or the specific product.
    // Based on admin.js, it saves specific product or all.
    // Let's easier: if the body has keys that match product IDs, update them.

    // Actually, to keep it simple with the current admin.js structure which might save ONE product at a time:
    // "products[currentProduct.key] = currentProduct.data; saveProducts(products);"
    // So the client sends the WHOLE generic object.

    // Efficient approach: Loop through keys and upsert.

    try {
        const productKeys = Object.keys(products);

        await db.run('BEGIN');

        for (const key of productKeys) {
            const dataStr = JSON.stringify(products[key]);

            // Upsert
            const existing = await db.get('SELECT id FROM products WHERE id = ?', [key]);
            if (existing) {
                await db.run('UPDATE products SET data = ? WHERE id = ?', [dataStr, key]);
            } else {
                await db.run('INSERT INTO products (id, data) VALUES (?, ?)', [key, dataStr]);
            }
        }

        await db.run('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to save products' });
    }
});

// GET Orders (Protected)
app.get('/api/orders', requireAdmin, async (req, res) => {
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

// CREATE Order (Public)
app.post('/api/orders', async (req, res) => {
    const order = req.body;
    // We need ID, status, timestamp
    const id = order.id || `ORD-${Date.now()}`;
    const status = order.status || 'pending';
    const timestamp = order.timestamp || Date.now();

    // Ensure these fields are in the data blob too
    order.id = id;
    order.status = status;
    order.timestamp = timestamp;

    try {
        await db.run('INSERT INTO orders (id, data, status, created_at) VALUES (?, ?, ?, ?)',
            [id, JSON.stringify(order), status, timestamp]);
        res.json({ success: true, orderId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// UPDATE Order (Protected)
app.put('/api/orders/:id', requireAdmin, async (req, res) => {
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
app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM orders WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Image Upload (Protected)
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
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


// --- INITIALIZATION ---

// Easy Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Seed data from the existing products-data.js file if DB is empty
const seedProducts = async () => {
    const hasProducts = await db.get('SELECT 1 FROM products LIMIT 1');
    if (!hasProducts) {
        console.log('Seeding database with default products...');
        // We'll manually copy the object structure here to ensure it's clean
        // This is a condensed version of the file content

        const DEFAULT_PRODUCTS = {
            "CHEMISE": {
                displayName: "CHEMISE",
                consumption: { entire: 2.20 },
                coverImage: "images/chemise/cover.jpg",
                sketchImage: "images/chemise/CHEMISE_SKETCH.png",
                patterns: [
                    { id: "CH1", name: "CH 1", image: "images/chemise/CHEMISE_PATTERNS/CH1.png" },
                    { id: "CH2", name: "CH 2", image: "images/chemise/CHEMISE_PATTERNS/CH2.png" },
                    { id: "CH3", name: "CH 3", image: "images/chemise/CHEMISE_PATTERNS/CH3.png" },
                    { id: "CH4", name: "CH 4", image: "images/chemise/CHEMISE_PATTERNS/CH4.png" },
                    { id: "CH5", name: "CH 5", image: "images/chemise/CHEMISE_PATTERNS/CH5.png" },
                    { id: "CH6", name: "CH 6", image: "images/chemise/CHEMISE_PATTERNS/CH6.png" },
                    { id: "CH7", name: "CH 7", image: "images/chemise/CHEMISE_PATTERNS/CH7.png" },
                    { id: "CH8", name: "CH 8", image: "images/chemise/CHEMISE_PATTERNS/CH8.png" },
                    { id: "CH9", name: "CH 9", image: "images/chemise/CHEMISE_PATTERNS/CH9.png" },
                    { id: "CH10", name: "CH 10", image: "images/chemise/CHEMISE_PATTERNS/CH10.png" },
                    { id: "CH11", name: "CH 11", image: "images/chemise/CHEMISE_PATTERNS/CH11.png" },
                    { id: "CH12", name: "CH 12", image: "images/chemise/CHEMISE_PATTERNS/CH12.png" },
                    { id: "CH13", name: "CH 13", image: "images/chemise/CHEMISE_PATTERNS/CH13.png" },
                    { id: "CH14", name: "CH 14", image: "images/chemise/CHEMISE_PATTERNS/CH14.png" },
                    { id: "CH15", name: "CH 15", image: "images/chemise/CHEMISE_PATTERNS/CH15.png" },
                    { id: "CH16", name: "CH 16", image: "images/chemise/CHEMISE_PATTERNS/CH16.png" },
                    { id: "CH17", name: "CH 17", image: "images/chemise/CHEMISE_PATTERNS/CH17.png" },
                    { id: "CH18", name: "CH 18", image: "images/chemise/CHEMISE_PATTERNS/CH18.png" },
                    { id: "BLACK", name: "BLACK", image: "https://placehold.co/165x165/000000/000000" },
                    { id: "WHITE", name: "WHITE", image: "https://placehold.co/165x165/ffffff/ffffff" }
                ]
            },
            "PONTALON": {
                displayName: "PONTALON",
                consumption: { entire: 2.25 },
                coverImage: "images/pontalon/cover.jpg",
                sketchImage: "images/pontalon/PONTALON_SKETCH.png",
                patterns: [
                    { id: "P1", name: "P 1", image: "images/pontalon/PONTALON_PATTERNS/P1.png" },
                    { id: "P2", name: "P 2", image: "images/pontalon/PONTALON_PATTERNS/P2.png" },
                    { id: "P3", name: "P 3", image: "images/pontalon/PONTALON_PATTERNS/P3.png" },
                    { id: "P4", name: "P 4", image: "images/pontalon/PONTALON_PATTERNS/P4.png" },
                    { id: "P5", name: "P 5", image: "images/pontalon/PONTALON_PATTERNS/P5.png" },
                    { id: "P6", name: "P 6", image: "images/pontalon/PONTALON_PATTERNS/P6.png" },
                    { id: "P7", name: "P 7", image: "images/pontalon/PONTALON_PATTERNS/P7.png" },
                    { id: "P8", name: "P 8", image: "images/pontalon/PONTALON_PATTERNS/P8.png" },
                    { id: "P9", name: "P 9", image: "images/pontalon/PONTALON_PATTERNS/P9.png" },
                    { id: "P10", name: "P 10", image: "images/pontalon/PONTALON_PATTERNS/P10.png" }
                ]
            },
            "SANT MANCH": {
                displayName: "CHEMISE SANS MANCHE",
                consumption: { entire: 1.35 },
                coverImage: "images/santmanch/cover.jpg",
                sketchImage: "images/santmanch/CHEMISE_SANS_MANCHE_SKETCH.png",
                patterns: [
                    { id: "CHM1", name: "CSM 1", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM1.png" },
                    { id: "CHM2", name: "CSM 2", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM2.png" },
                    { id: "CHM3", name: "CSM 3", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM3.png" },
                    { id: "CHM4", name: "CSM 4", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM4.png" },
                    { id: "CHM5", name: "CSM 5", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM5.png" },
                    { id: "CHM6", name: "CSM 6", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM6.png" },
                    { id: "CHM7", name: "CSM 7", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM7.png" },
                    { id: "CHM8", name: "CSM 8", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM8.png" },
                    { id: "CHM9", name: "CSM 9", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM9.png" },
                    { id: "CHM10", name: "CSM 10", image: "images/santmanch/CHEMISE_SANS_MANCHE_PATTERNS/CHM10.png" }
                ]
            },
            "JUPE": {
                displayName: "JUPE",
                consumption: { entire: 2.30 },
                coverImage: "images/jupe/cover.jpg",
                sketchImage: "images/jupe/JUPE_SKETCH.png",
                patterns: [
                    { id: "J1", name: "JUPE 1", image: "images/jupe/JUPE_PATTERNS/J1.png" },
                    { id: "J2", name: "JUPE 2", image: "images/jupe/JUPE_PATTERNS/J2.png" },
                    { id: "J3", name: "JUPE 3", image: "images/jupe/JUPE_PATTERNS/J3.png" },
                    { id: "J4", name: "JUPE 4", image: "images/jupe/JUPE_PATTERNS/J4.png" },
                    { id: "J5", name: "JUPE 5", image: "images/jupe/JUPE_PATTERNS/J5.png" },
                    { id: "J6", name: "JUPE 6", image: "images/jupe/JUPE_PATTERNS/J6.png" },
                    { id: "J7", name: "JUPE 7", image: "images/jupe/JUPE_PATTERNS/J7.png" }
                ]
            },
            "MANTEAU DROIT": {
                displayName: "MANTEAU DROIT",
                consumption: { outside: 3.70, inside: 2.50 },
                coverImage: "images/manteaudroit/cover.jpg",
                sketchImage: "images/manteaudroit/MANTEAU_DROIT_SKETCH.png",
                patterns: [
                    { id: "MD1", name: "MD 1", image: "images/manteaudroit/MANTEAU_DROIT_PATTERNS/MD1.jpg" },
                    { id: "MD2", name: "MD 2", image: "images/manteaudroit/MANTEAU_DROIT_PATTERNS/MD2.jpg" }
                ]
            },
            "ROBE ESABEL": {
                displayName: "ROBE ESABEL",
                consumption: { entire: 3.10 },
                coverImage: "images/robeesabel/cover.jpg",
                sketchImage: "images/robeesabel/ROBE_ESABEL_SKETCH.png",
                patterns: [
                    { id: "RE1", name: "RE 1", image: "images/robeesabel/ROBE_ESABEL_PATTERNS/RE1.png" },
                    { id: "RE2", name: "RE 2", image: "images/robeesabel/ROBE_ESABEL_PATTERNS/RE2.png" }
                ]
            },
            "TOP ESABEL": {
                displayName: "TOP ESABEL",
                consumption: { entire: 2.20 },
                coverImage: "images/topesabel/cover.jpg",
                sketchImage: "images/topesabel/TOP_ESABEL_SKETCH.png",
                patterns: [
                    { id: "TE1", name: "TE 1", image: "images/topesabel/TOP_ESABEL_PATTERNS/TE1.png" },
                    { id: "TE2", name: "TE 2", image: "images/topesabel/TOP_ESABEL_PATTERNS/TE2.png" }
                ]
            },
            "MANTEAU 3/4": {
                displayName: "MANTEAU 3/4",
                consumption: { outside: 4.00, inside: 2.50 },
                coverImage: "images/manteautrois/cover.jpg",
                sketchImage: "images/manteautrois/MANTEAU_3_4_SKETCH.png",
                patterns: [
                    { id: "MDT1", name: "M3Q 1", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT1.jpg" },
                    { id: "MDT2", name: "M3Q 2", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT2.jpg" },
                    { id: "MDT3", name: "M3Q 3", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT3.jpg" }
                ]
            },
            "MANTEAU LONG": {
                displayName: "MANTEAU LONG",
                consumption: { outside: 4.00, inside: 2.60 },
                coverImage: "images/manteaulong/cover.jpg",
                sketchImage: "images/manteaulong/MANTEAU_LONG_SKETCH.png",
                patterns: [
                    { id: "V1", name: "ML 1", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V1.jpg" },
                    { id: "V2", name: "ML 2", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V2.jpg" },
                    { id: "V3", name: "ML 3", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V3.jpg" },
                    { id: "V4", name: "ML 4", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V4.jpg" },
                    { id: "V5", name: "ML 5", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V5.jpg" }
                ]
            },
            "VEST": {
                displayName: "VEST",
                consumption: { outside: 2.10, inside: 1.50 },
                coverImage: "images/vest/cover.jpg",
                sketchImage: "images/vest/VEST_SKETCH.png",
                patterns: [
                    { id: "V1", name: "VEST 1", image: "images/vest/VEST_PATTERNS/V1.jpg" },
                    { id: "V2", name: "VEST 2", image: "images/vest/VEST_PATTERNS/V2.jpg" },
                    { id: "V3", name: "VEST 3", image: "images/vest/VEST_PATTERNS/V3.jpg" },
                    { id: "V4", name: "VEST 4", image: "images/vest/VEST_PATTERNS/V4.jpg" },
                    { id: "V5", name: "VEST 5", image: "images/vest/VEST_PATTERNS/V5.jpg" },
                    { id: "V6", name: "VEST 6", image: "images/vest/VEST_PATTERNS/V6.jpg" },
                    { id: "V7", name: "VEST 7", image: "images/vest/VEST_PATTERNS/V7.jpg" },
                    { id: "V8", name: "VEST 8", image: "images/vest/VEST_PATTERNS/V8.jpg" },
                    { id: "V9", name: "VEST 9", image: "images/vest/VEST_PATTERNS/V9.jpg" },
                    { id: "V10", name: "VEST 10", image: "images/vest/VEST_PATTERNS/V10.jpg" }
                ]
            },
            "ROBE LONG": {
                displayName: "ROBE LONG",
                consumption: { entire: 3.80 },
                coverImage: "images/robelong/cover.jpg",
                sketchImage: "images/robelong/ROBE_LONG_SKETCH.png",
                patterns: [
                    { id: "R1", name: "RL 1", image: "images/robelong/ROBE_LONG/R1.png" },
                    { id: "R2", name: "RL 2", image: "images/robelong/ROBE_LONG/R2.png" },
                    { id: "R3", name: "RL 3", image: "images/robelong/ROBE_LONG/R3.png" },
                    { id: "R4", name: "RL 4", image: "images/robelong/ROBE_LONG/R4.png" },
                    { id: "R5", name: "RL 5", image: "images/robelong/ROBE_LONG/R5.png" },
                    { id: "R6", name: "RL 6", image: "images/robelong/ROBE_LONG/R6.png" },
                    { id: "R7", name: "RL 7", image: "images/robelong/ROBE_LONG/R7.png" },
                    { id: "R8", name: "RL 8", image: "images/robelong/ROBE_LONG/R8.png" },
                    { id: "R9", name: "RL 9", image: "images/robelong/ROBE_LONG/R9.png" },
                    { id: "R10", name: "RL 10", image: "images/robelong/ROBE_LONG/R10.png" },
                    { id: "R11", name: "RL 11", image: "images/robelong/ROBE_LONG/R11.png" }
                ]
            }
        };

        const keys = Object.keys(DEFAULT_PRODUCTS);
        await db.run('BEGIN');
        for (const key of keys) {
            await db.run('INSERT INTO products (id, data) VALUES (?, ?)', [key, JSON.stringify(DEFAULT_PRODUCTS[key])]);
        }
        await db.run('COMMIT');
        console.log('Seeding complete.');
    }
}

// Start Server
db.init().then(() => {
    seedProducts().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
