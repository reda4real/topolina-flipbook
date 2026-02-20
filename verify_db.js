require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyDatabase() {
    console.log('--- Starting Database Verification ---');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`DB Name: ${process.env.DB_NAME}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        console.log('✅ Connection Successful');

        const tables = ['products', 'patterns', 'fabrics', 'orders', 'uploads'];
        const results = {};

        for (const table of tables) {
            try {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
                console.log(`✅ Table '${table}' exists. Rows: ${rows[0].count}`);
                results[table] = { exists: true, count: rows[0].count, columns: columns.map(c => c.Field) };
            } catch (err) {
                console.error(`❌ Table '${table}' ERROR: ${err.message}`);
                results[table] = { exists: false, error: err.message };
            }
        }

        console.log('\n--- Detailed Data Check ---');
        // Check for specific critical data if any (e.g., at least one product)
        if (results.products && results.products.count === 0) {
            console.warn('⚠️  WARNING: Products table is empty. The flipbook will be empty.');
        }

        // Check columns for products table to ensure schema matches code
        if (results.products && results.products.exists) {
            const requiredCols = ['id', 'display_name', 'price_ex_works'];
            const missing = requiredCols.filter(c => !results.products.columns.includes(c));
            if (missing.length > 0) {
                console.error(`❌ Schema Mismatch: 'products' table missing columns: ${missing.join(', ')}`);
            } else {
                console.log(`✅ Schema check passed for 'products' (key columns present).`);
            }
        }

    } catch (err) {
        console.error('❌ FATAL: Could not connect to database.');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
    } finally {
        if (connection) await connection.end();
        console.log('--- Verification Complete ---');
    }
}

verifyDatabase();
