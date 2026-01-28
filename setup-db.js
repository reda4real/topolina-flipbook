require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    console.log("Setting up database...");
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: '', // We found this is the correct one
    };

    try {
        const conn = await mysql.createConnection(config);
        console.log("Connected to MySQL server.");

        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'topolina_db'}`);
        console.log(`Database '${process.env.DB_NAME || 'topolina_db'}' created or verified.`);

        await conn.end();
        console.log("Setup complete via setup-db.js");
    } catch (err) {
        console.error("Setup failed:", err);
    }
})();
