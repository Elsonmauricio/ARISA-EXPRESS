require('dotenv').config({ path: __dirname + '/.env' });
const app = require('./dist/server');
const { db, firebaseInitialized } = require('./dist/config/firebase');
const { WhatsAppService } = require('./dist/services/whatsappService');
const { logger } = require('./dist/utils/logger');

async function test() {
    console.log('=== Backend Local Integration Test ===\n');
    console.log('Firebase initialized:', firebaseInitialized);
    console.log('WhatsApp configured:', WhatsAppService.isConfigured());

    // Check if there are any shipments in Firestore
    console.log('\n--- Checking shipments collection ---');
    try {
        const snapshot = await db.collection('shipments').limit(3).get();
        console.log('Shipments found:', snapshot.size);
        snapshot.forEach(doc => {
            console.log(`  - ${doc.id}: trackingCode=${doc.data().trackingCode}, receiverName=${doc.data().receiverName}, receiverPhone=${doc.data().receiverPhone}`);
        });
    } catch (err) {
        console.log('Error reading shipments:', err.message);
    }

    // Check if there are any orders
    console.log('\n--- Checking orders collection ---');
    try {
        const snapshot = await db.collection('orders').limit(3).get();
        console.log('Orders found:', snapshot.size);
    } catch (err) {
        console.log('No orders collection or error:', err.message);
    }

    console.log('\n--- Testing WhatsAppService.sendPickupNotification (mock mode) ---');
    if (!WhatsAppService.isConfigured()) {
        const result = await WhatsAppService.sendPickupNotification({
            phone: '+351934292082',
            trackingCode: 'TEST-001',
            shipmentDate: '20/09/2026',
            deadline: '25/09/2026',
            senderName: 'Arisa Express',
            receiverName: 'Test Client',
            pickupAddress: 'Test Address',
            pickupContact: '+351 934 292 082',
            pickupSchedule: 'Test Schedule',
            location: 'lisbon',
            destination: 'Lisboa'
        });
        console.log('Result:', JSON.stringify(result, null, 2));
    } else {
        console.log('WhatsApp is configured - will test actual Meta API call');
        const result = await WhatsAppService.sendPickupNotification({
            phone: '+351934292082',
            trackingCode: 'TEST-001',
            shipmentDate: '20/09/2026',
            deadline: '25/09/2026',
            senderName: 'Arisa Express',
            receiverName: 'Test Client',
            pickupAddress: 'Test Address',
            pickupContact: '+351 934 292 082',
            pickupSchedule: 'Test Schedule',
            location: 'lisbon',
            destination: 'Lisboa'
        });
        console.log('Result:', JSON.stringify(result, null, 2));
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });