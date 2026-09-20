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
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function test() {
    console.log('=== Backend API Tests with Real Orders ===\n');

    // Test 1: Order AE-2026-9D25 (Lisboa)
    console.log('--- Test 1: AE-2026-9D25 (Lisboa) ---');
    try {
        const r1 = await httpsPost('https://arisa-backend.vercel.app/api/notify-whatsapp', JSON.stringify({
            orderCode: 'AE-2026-9D25',
            customerPhone: '+351967711770',
            destination: 'Lisboa'
        }));
        console.log('Status:', r1.status);
        console.log('Response:', JSON.stringify(r1.body, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 2: Order AE-2026-EB01 (Lisboa)
    console.log('\n--- Test 2: AE-2026-EB01 (Lisboa) ---');
    try {
        const r2 = await httpsPost('https://arisa-backend.vercel.app/api/notify-whatsapp', JSON.stringify({
            orderCode: 'AE-2026-EB01',
            customerPhone: '+351967711770',
            destination: 'Lisboa'
        }));
        console.log('Status:', r2.status);
        console.log('Response:', JSON.stringify(r2.body, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 3: Non-existent order
    console.log('\n--- Test 3: Non-existent order ---');
    try {
        const r3 = await httpsPost('https://arisa-backend.vercel.app/api/notify-whatsapp', JSON.stringify({
            orderCode: 'NONEXISTENT',
            customerPhone: '+351967711770',
            destination: 'Lisboa'
        }));
        console.log('Status:', r3.status);
        console.log('Response:', JSON.stringify(r3.body, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 4: Missing required fields
    console.log('\n--- Test 4: Missing fields ---');
    try {
        const r4 = await httpsPost('https://arisa-backend.vercel.app/api/notify-whatsapp', JSON.stringify({
            orderCode: 'AE-2026-9D25'
        }));
        console.log('Status:', r4.status);
        console.log('Response:', JSON.stringify(r4.body, null, 2));
    } catch(e) { console.log('Error:', e); }

    console.log('\n=== Tests Complete ===');
}

test().catch(err => { console.error(err); process.exit(1); });