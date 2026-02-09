const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// DEFAULT PRODUCTS DATA (extracted from server.js for analysis)
const PRODUCTS = {
    "CHEMISE": {
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
            { id: "CH18", name: "CH 18", image: "images/chemise/CHEMISE_PATTERNS/CH18.png" }
        ]
    },
    "PONTALON": {
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
        patterns: [
            { id: "MD1", name: "MD 1", image: "images/manteaudroit/MANTEAU_DROIT_PATTERNS/MD1.jpg" },
            { id: "MD2", name: "MD 2", image: "images/manteaudroit/MANTEAU_DROIT_PATTERNS/MD2.jpg" }
        ]
    },
    "ROBE ESABEL": {
        patterns: [
            { id: "RE1", name: "RE 1", image: "images/robeesabel/ROBE_ESABEL_PATTERNS/RE1.png" },
            { id: "RE2", name: "RE 2", image: "images/robeesabel/ROBE_ESABEL_PATTERNS/RE2.png" }
        ]
    },
    "TOP ESABEL": {
        patterns: [
            { id: "TE1", name: "TE 1", image: "images/topesabel/TOP_ESABEL_PATTERNS/TE1.png" },
            { id: "TE2", name: "TE 2", image: "images/topesabel/TOP_ESABEL_PATTERNS/TE2.png" }
        ]
    },
    "MANTEAU 3/4": {
        patterns: [
            { id: "MDT1", name: "M3Q 1", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT1.jpg" },
            { id: "MDT2", name: "M3Q 2", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT2.jpg" },
            { id: "MDT3", name: "M3Q 3", image: "images/manteautrois/MANTEAU_3_4_PATTERNS/MDT3.jpg" }
        ]
    },
    "MANTEAU LONG": {
        patterns: [
            { id: "V1", name: "ML 1", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V1.jpg" },
            { id: "V2", name: "ML 2", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V2.jpg" },
            { id: "V3", name: "ML 3", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V3.jpg" },
            { id: "V4", name: "ML 4", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V4.jpg" },
            { id: "V5", name: "ML 5", image: "images/manteaulong/MANTEAU_LONG_PATTERNS/V5.jpg" }
        ]
    },
    "VEST": {
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

function getFileHash(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5');
        hash.update(fileBuffer);
        return hash.digest('hex');
    } catch (e) {
        console.error('Error hashing file:', filePath, e.message);
        return null;
    }
}

function analyze() {
    console.log('--- Analyzing Patterns for Duplicates ---');
    const hashToPattern = {};
    const missingFiles = [];

    Object.keys(PRODUCTS).forEach(prodKey => {
        const product = PRODUCTS[prodKey];
        product.patterns.forEach(pattern => {
            const fullPath = path.resolve(__dirname, pattern.image);

            // Skip placeholders
            if (pattern.image.startsWith('http')) return;

            const hash = getFileHash(fullPath);

            if (!hash) {
                missingFiles.push(`${prodKey} - ${pattern.name} (${pattern.image})`);
                return;
            }

            if (!hashToPattern[hash]) {
                hashToPattern[hash] = [];
            }
            hashToPattern[hash].push({
                product: prodKey,
                patternId: pattern.id,
                patternName: pattern.name,
                path: pattern.image
            });
        });
    });

    // Report
    let duplicateCount = 0;
    Object.keys(hashToPattern).forEach(hash => {
        const occurrences = hashToPattern[hash];
        if (occurrences.length > 1) {
            duplicateCount++;
            console.log(`\nDuplicate Image Found (${occurrences.length} times):`);
            occurrences.forEach(occ => {
                console.log(`  - ${occ.product}: ${occ.patternName} (ID: ${occ.patternId}) -> ${occ.path}`);
            });
        }
    });

    if (duplicateCount === 0) {
        console.log('\nNo duplicated pattern images found.');
    } else {
        console.log(`\nFound ${duplicateCount} visually identical patterns used across products.`);
    }

    if (missingFiles.length > 0) {
        console.log('\nMissing Files:', missingFiles.length);
        // missingFiles.forEach(f => console.log(f));
    }
}

analyze();
