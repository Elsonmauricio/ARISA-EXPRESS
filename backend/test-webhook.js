require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`HTTP ${res.statusCode}`);
                try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function test() {
    console.log('=== Webhook Tests ===\n');

    // Test 1: Webhook verification (GET)
    console.log('--- Test 1: Webhook GET verification ---');
    try {
        const r1 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook?hub_mode=subscribe&hub_verify_token=arisa-express&hub_challenge=test123', '');
        console.log(JSON.stringify(r1, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 2: Webhook POST with simulated Meta status event
    console.log('\n--- Test 2: Webhook POST - Status event (sent) ---');
    try {
        const payload2 = {
            object: 'whatsapp_business_account',
            entry: [{
                id: '391662534038300',
                time: Math.floor(Date.now() / 1000),
                changes: [{
                    value: {
                        statuses: [{
                            id: 'wamid-test-001',
                            status: 'sent',
                            recipient_id: '351934292082',
                            timestamp: Math.floor(Date.now() / 1000).toString()
                        }]
                    }
                }]
            }]
        };
        const r2 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook', JSON.stringify(payload2));
        console.log(JSON.stringify(r2, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 3: Webhook POST with delivered event
    console.log('\n--- Test 3: Webhook POST - Delivered event ---');
    try {
        const payload3 = {
            object: 'whatsapp_business_account',
            entry: [{
                id: '391662534038300',
                time: Math.floor(Date.now() / 1000),
                changes: [{
                    value: {
                        statuses: [{
                            id: 'wamid-test-002',
                            status: 'delivered',
                            recipient_id: '351934292082',
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            errors: []
                        }]
                    }
                }]
            }]
        };
        const r3 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook', JSON.stringify(payload3));
        console.log(JSON.stringify(r3, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 4: Webhook POST with read event
    console.log('\n--- Test 4: Webhook POST - Read event ---');
    try {
        const payload4 = {
            object: 'whatsapp_business_account',
            entry: [{
                id: '391662534038300',
                time: Math.floor(Date.now() / 1000),
                changes: [{
                    value: {
                        statuses: [{
                            id: 'wamid-test-003',
                            status: 'read',
                            recipient_id: '351934292082',
                            timestamp: Math.floor(Date.now() / 1000).toString()
                        }]
                    }
                }]
            }]
        };
        const r4 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook', JSON.stringify(payload4));
        console.log(JSON.stringify(r4, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 5: Webhook POST with failed event
    console.log('\n--- Test 5: Webhook POST - Failed event ---');
    try {
        const payload5 = {
            object: 'whatsapp_business_account',
            entry: [{
                id: '391662534038300',
                time: Math.floor(Date.now() / 1000),
                changes: [{
                    value: {
                        statuses: [{
                            id: 'wamid-test-004',
                            status: 'failed',
                            recipient_id: '351934292082',
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            errors: [{
                                code: 131026,
                                title: 'Número inválido ou sem WhatsApp',
                                message: 'The recipient phone number is invalid'
                            }]
                        }]
                    }
                }]
            }]
        };
        const r5 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook', JSON.stringify(payload5));
        console.log(JSON.stringify(r5, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 6: Webhook with wrong verify token
    console.log('\n--- Test 6: Webhook with wrong verify token ---');
    try {
        const r6 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook?hub_mode=subscribe&hub_verify_token=wrong-token&hub_challenge=test123', '');
        console.log(JSON.stringify(r6, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 7: Webhook with no params
    console.log('\n--- Test 7: Webhook with no params ---');
    try {
        const r7 = await httpsPost('https://arisa-backend.vercel.app/api/webhook/webhook', '');
        console.log(JSON.stringify(r7, null, 2));
    } catch(e) { console.log('Error:', e); }
}

test().catch(err => { console.error(err); process.exit(1); });