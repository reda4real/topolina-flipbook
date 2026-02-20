const mysql = require('mysql2/promise');

// MySQL Setup
let mysqlPool;

async function init() {
    console.log('Connecting to MySQL database...');
    try {
        mysqlPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test connection
        await mysqlPool.query('SELECT 1');
        console.log('MySQL Connected successfully.');

        // Create Tables
        await createTablesMysql();
    } catch (err) {
        console.error('MySQL Connection Failed:', err.message);
        throw err;
    }
}

// --- TABLE CREATION ---

async function createTablesMysql() {
    const conn = await mysqlPool.getConnection();
    try {
        await conn.query(`CREATE TABLE IF NOT EXISTS products (
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
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS patterns (
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
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            data LONGTEXT,
            status VARCHAR(50),
            created_at BIGINT
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS uploads (
            filename VARCHAR(255) PRIMARY KEY,
            original_name VARCHAR(255),
            uploaded_at BIGINT
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS fabrics (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            availableMeters REAL
        )`);
    } finally {
        conn.release();
    }
}

// --- WRAPPERS ---

function query(sql, params = []) {
    return mysqlPool.query(sql, params).then(([rows]) => rows);
}

function run(sql, params = []) {
    // Check for transaction commands
    const cmd = sql.trim().toUpperCase();
    if (cmd === 'BEGIN' || cmd === 'COMMIT' || cmd === 'ROLLBACK') {
        return mysqlPool.query(sql, params).then(([result]) => {
            return {
                lastID: result.insertId,
                changes: result.affectedRows
            };
        });
    }

    return mysqlPool.execute(sql, params).then(([result]) => {
        return {
            lastID: result.insertId,
            changes: result.affectedRows
        };
    });
}

function get(sql, params = []) {
    return mysqlPool.query(sql, params).then(([rows]) => rows[0]);
}

module.exports = {
    init,
    query,
    run,
    get,
    getConnection: () => mysqlPool.getConnection()
};
