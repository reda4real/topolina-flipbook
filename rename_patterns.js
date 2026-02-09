const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// const axios = require('axios'); // Removed

// Function to generate names
const SET_NAMES = [
    "Royal", "Imperial", "Majestic", "Divine", "Ethereal",
    "Radiant", "Luminous", "Vibrant", "Serene", "Mystic"
];

const UNIQUE_NAMES = [
    "Aurora", "Borealis", "Cosmos", "Drift", "Eclipse", "Flare", "Galaxy", "Halo", "Iris", "Jazz",
    "Karma", "Lotus", "Matrix", "Nebula", "Orbit", "Prism", "Quest", "Ripple", "Solstice", "Tide",
    "Unity", "Vortex", "Wave", "Xenon", "Yield", "Zenith", "Amber", "Bloom", "Coral", "Dusk",
    "Echo", "Fern", "Glow", "Haze", "Ivy", "Jade", "Kite", "Luna", "Moss", "Nova",
    "Olive", "Pearl", "Quartz", "Rose", "Sage", "Teal", "Umber", "Violet", "Willow", "Xylo",
    "Yarn", "Zinc", "Acacia", "Bamboo", "Cedar", "Dahlia", "Elm", "Fir", "Ginger", "Hazel",
    "Indigo", "Jasmine", "Kale", "Lily", "Maple", "Nectar", "Oak", "Pine", "Quince", "Reed"
];

let nameIndex = 0;
function getUniqueName() {
    if (nameIndex >= UNIQUE_NAMES.length) return `Design ${nameIndex + 1}`;
    return UNIQUE_NAMES[nameIndex++];
}

// Extract the DEFAULT_PRODUCTS object from server.js
// Since we can't easily require('server.js') due to its structure, we'll read and parse or copy/paste.
// For this script, I'll reconstruct the data or read it from the JSON I created in the previous step... 
// actually I didn't create a JSON.
// I will READ products from the local API to ensure I have the latest state, then modify.

// Wait, I am in a Node script. I can just fetch from localhost:3000/api/products
// But I need to hash files to find duplicates again to be sure (or trust my previous output).
// I will re-hash to be robust.

async function run() {
    // const fetch = (await import('node-fetch')).default; // Native fetch available in Node 18+

    console.log('Fetching current products...');
    let products;
    try {
        const res = await fetch('http://localhost:3000/api/products');
        products = await res.json();
    } catch (e) {
        console.error('Failed to fetch from server. Make sure server is running.');
        process.exit(1);
    }

    const hashToPatterns = {};
    const patternList = [];

    // 1. Analyze and Group
    Object.keys(products).forEach(prodKey => {
        const product = products[prodKey];
        product.patterns.forEach(pattern => {
            const fullPath = path.resolve(__dirname, pattern.image);
            let hash = 'placeholder_' + Math.random(); // Default for placeholders

            if (!pattern.image.startsWith('http')) {
                try {
                    if (fs.existsSync(fullPath)) {
                        const fileBuffer = fs.readFileSync(fullPath);
                        hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
                    }
                } catch (e) { }
            }

            if (!hashToPatterns[hash]) hashToPatterns[hash] = [];

            const pObj = {
                productKey: prodKey,
                pattern: pattern,
                hash: hash
            };
            hashToPatterns[hash].push(pObj);
            patternList.push(pObj);
        });
    });

    // 2. Assign Names
    let setIndex = 0;

    // Sort hashes by number of occurrences to handle sets first
    const hashes = Object.keys(hashToPatterns).sort((a, b) => hashToPatterns[b].length - hashToPatterns[a].length);

    hashes.forEach(hash => {
        const group = hashToPatterns[hash];
        let newName;

        if (group.length > 1) {
            // It's a set
            const setName = SET_NAMES[setIndex++] || `Set ${setIndex}`;
            newName = `${setName} Collection ✦`;
        } else {
            // Unique
            newName = getUniqueName();
        }

        // Apply new name to all in group
        group.forEach(item => {
            item.pattern.name = newName;
            // distinct ID? item.pattern.id = ... keep existing ID to avoid breaking references
        });
    });

    // 3. Save back to server
    console.log('Sending updates to server...');
    try {
        // We need an admin token. In server.js it was hardcoded or simple.
        // admin.js uses 'topolina_admin_session' which is a password/token.
        // I'll grab it from a hardcoded value since I know the password is 'topolina2024'
        const token = 'topolina2024';

        // The API /api/products (POST) expects the whole products map
        const res = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(products)
        });

        if (res.ok) {
            console.log('Successfully updated product names!');
        } else {
            console.error('Failed to update:', await res.text());
        }
    } catch (e) {
        console.error('Error saving:', e);
    }

    // Also output a summary
    console.log('\nName Mapping Summary:');
    hashes.forEach(hash => {
        const group = hashToPatterns[hash];
        if (group.length > 1) {
            console.log(`${group[0].pattern.name}: Shared by ${group.map(g => g.productKey).join(', ')}`);
        }
    });
}

run();
