require('dotenv').config();
const db = require('./database');

const CONSUMPTION_DATA = {
    "CHEMISE": { entire: 2.20 },
    "PONTALON": { entire: 2.25 },
    "SANT MANCH": { entire: 1.35 },
    "JUPE": { entire: 2.30 },
    "MANTEAU DROIT": { outside: 3.70, inside: 2.50 },
    "ROBE ESABEL": { entire: 3.10 },
    "TOP ESABEL": { entire: 2.20 },
    "MANTEAU 3/4": { outside: 4.00, inside: 2.50 },
    "MANTEAU LONG": { outside: 4.00, inside: 2.60 },
    "VEST": { outside: 2.10, inside: 1.50 },
    "ROBE LONG": { entire: 3.80 }
};

async function updateConsumption() {
    await db.init();
    console.log('Database initialized.');

    try {
        const products = await db.query('SELECT * FROM products');

        for (const row of products) {
            const productData = JSON.parse(row.data);
            const productId = row.id;

            if (CONSUMPTION_DATA[productId]) {
                productData.consumption = CONSUMPTION_DATA[productId];
                console.log(`Updating ${productId} with consumption data...`);

                await db.run('UPDATE products SET data = ? WHERE id = ?', [JSON.stringify(productData), productId]);
            }
        }
        console.log('All products updated successfully.');
    } catch (err) {
        console.error('Error updating products:', err);
    }
    process.exit();
}

updateConsumption();
