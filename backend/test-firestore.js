require('dotenv').config({ path: __dirname + '/.env' });
const { db } = require('./dist/config/firebase');
const { logger } = require('./dist/utils/logger');

async function test() {
    console.log('=== Firestore Verification ===\n');

    // Check shipment AE-2026-9D25
    console.log('--- Shipment AE-2026-9D25 ---');
    try {
        const snapshot1 = await db.collection('shipments').where('trackingCode', '==', 'AE-2026-9D25').limit(1).get();
        if (!snapshot1.empty) {
            const doc = snapshot1.docs[0];
            console.log('Document ID:', doc.id);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        } else {
            console.log('Not found');
        }
    } catch (err) { console.log('Error:', err.message); }

    // Check shipment AE-2026-EB01
    console.log('\n--- Shipment AE-2026-EB01 ---');
    try {
        const snapshot2 = await db.collection('shipments').where('trackingCode', '==', 'AE-2026-EB01').limit(1).get();
        if (!snapshot2.empty) {
            const doc = snapshot2.docs[0];
            console.log('Document ID:', doc.id);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        } else {
            console.log('Not found');
        }
    } catch (err) { console.log('Error:', err.message); }

    console.log('\n=== Verification Complete ===');
    process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });