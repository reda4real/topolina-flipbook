require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection(config, label) {
    console.log(`\n--- Test: ${label} ---`);
    console.log(`Host: ${config.host}, User: ${config.user}, DB: ${config.database || '(none)'}`);
    try {
        const conn = await mysql.createConnection(config);
        console.log('✅ SUCCESS! Connection established.');

        if (!config.database) {
            const [rows] = await conn.query("SHOW DATABASES LIKE 'topolina_db'");
            if (rows.length > 0) console.log("   -> Database 'topolina_db' EXISTS.");
            else console.log("   -> Database 'topolina_db' DOES NOT EXIST.");
        }

        await conn.end();
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        return false;
    }
}

(async () => {
    const originalPass = process.env.DB_PASSWORD || "";

    // 1. Exact Config
    await testConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: originalPass,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    }, "Standard .env Config");


    // 2. Auto-Discovery
    console.log("\n--- Attempting Auto-Discovery of Credentials ---");
    const commonPasswords = [
        "",
        "root",
        "password",
        "admin",
        "123456",
        originalPass.replace('@', ''),
        originalPass.replace(/"/g, ''), // Strip quotes if they were read literally
        "Noc1122332",
        "Noc1122332@"
    ];

    const uniquePasswords = [...new Set(commonPasswords)];

    for (const pass of uniquePasswords) {
        if (pass === undefined) continue;
        process.stdout.write(`Trying password: '${pass}' ... `);
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pass
            });
            console.log("✅ SUCCESS!");
            console.log("\n🎊 FOUND WORKING PASSWORD: '" + pass + "'");
            await conn.end();
            process.exit(0);
        } catch (e) {
            console.log("❌");
        }
    }

    console.log("\n❌ Could not find working password for 'root'.");
})();
