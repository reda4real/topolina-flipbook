require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Starting migration...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        await connection.beginTransaction();

        // 1. Rename existing products table to backup
        console.log('Backing up old products table...');
        // Check if backup already exists to avoid error on re-run
        const [tables] = await connection.query("SHOW TABLES LIKE 'products_old'");
        if (tables.length === 0) {
            await connection.query('RENAME TABLE products TO products_old');
        } else {
            console.log('products_old already exists, assuming products is arguably new or check needed.');
            // For safety in this script, let's assume if products exists AND products_old exists, we might be partially migrated
            // But to be clean, let's just work from products_old if it exists
        }

        // 2. Create New Tables
        console.log('Creating new normalized tables...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(255) PRIMARY KEY,
                display_name VARCHAR(255),
                consumption_entire DECIMAL(10,2),
                consumption_outside DECIMAL(10,2),
                consumption_inside DECIMAL(10,2),
                cover_image VARCHAR(255),
                sketch_image VARCHAR(255),
                shop_image VARCHAR(255),
                price_ex_works DECIMAL(10,2),
                price_landed DECIMAL(10,2),
                price_retail DECIMAL(10,2)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS patterns (
                id VARCHAR(255),
                product_id VARCHAR(255),
                name VARCHAR(255),
                image VARCHAR(255),
                fabric_id VARCHAR(255),
                stock_type VARCHAR(50) DEFAULT 'meters',
                available_meters DECIMAL(10,2) DEFAULT 0,
                available_quantity INT DEFAULT 0,
                PRIMARY KEY (product_id, id),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        // 3. Migrate Data
        console.log('Migrating data...');
        const [rows] = await connection.query('SELECT * FROM products_old');

        for (const row of rows) {
            const data = JSON.parse(row.data);
            const productId = row.id;

            // Insert Product
            await connection.query(`
                INSERT INTO products (
                    id, display_name, consumption_entire, consumption_outside, consumption_inside, 
                    cover_image, sketch_image, shop_image, 
                    price_ex_works, price_landed, price_retail
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                productId,
                data.displayName || null,
                data.consumption?.entire || null,
                data.consumption?.outside || null,
                data.consumption?.inside || null,
                data.coverImage || null,
                data.sketchImage || null,
                data.shopImage || null,
                data.priceExWorks || null,
                data.priceLanded || null,
                data.priceRetail || null
            ]);

            // Insert Patterns
            if (data.patterns && Array.isArray(data.patterns)) {
                for (const p of data.patterns) {
                    await connection.query(`
                        INSERT INTO patterns (
                            id, product_id, name, image, fabric_id, 
                            stock_type, available_meters, available_quantity
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        p.id,
                        productId,
                        p.name || null,
                        p.image || null,
                        p.fabricId || null,
                        p.stockType || 'meters',
                        p.availableMeters || 0,
                        p.availableQuantity || 0
                    ]);
                }
            }
        }

        await connection.commit();
        console.log('Migration completed successfully!');

    } catch (err) {
        await connection.rollback();
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
