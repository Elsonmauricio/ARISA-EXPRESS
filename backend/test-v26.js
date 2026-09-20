require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

function graphRequest(method, path, accessToken, postData) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://graph.facebook.com/${path}`);
        url.searchParams.set('access_token', accessToken);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve(data); } });
        });
        req.on('error', reject);
        if (postData) { req.write(postData); }
        req.end();
    });
}

async function test() {
    const token = process.env.WHATSAPP_TOKEN;
    const wabaId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    console.log('=== Testing API Version v26.0 ===\n');

    // Test 1: Check if v26.0 is available (info endpoint)
    console.log('--- Test 1: Check v26.0 availability ---');
    try {
        const r1 = await graphRequest('GET', `v26.0/${wabaId}?fields=id,verified_name,display_phone_number,quality_rating,platform_type,code_verification_status,status`, token);
        console.log('v26.0 WABA Info:', JSON.stringify(r1, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 2: POST with v26.0 minimal
    console.log('\n--- Test 2: POST /messages via v26.0 (minimal) ---');
    try {
        const r2 = await graphRequest('POST', `v26.0/${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r2, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 3: POST with v26.0 full
    console.log('\n--- Test 3: POST /messages via v26.0 (full) ---');
    try {
        const r3 = await graphRequest('POST', `v26.0/${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '351934292082',
            type: 'template',
            template: {
                name: 'encomenda_disponivel_lisboa',
                language: { code: 'pt_PT' },
                components: [{
                    type: 'body',
                    parameters: [
                        { type: 'text', text: 'João Silva' },
                        { type: 'text', text: 'BR-20250920-001' },
                        { type: 'text', text: '20/09/2026' },
                        { type: 'text', text: '25/09/2026' },
                        { type: 'text', text: 'Arisa Express' },
                        { type: 'text', text: 'João Silva' },
                        { type: 'text', text: 'Centro Comercial Flamingos, Loja 47' },
                        { type: 'text', text: '+351 934 292 082' }
                    ]
                }]
            }
        }));
        console.log(JSON.stringify(r3, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 4: Check available versions
    console.log('\n--- Test 4: Check API version metadata ---');
    try {
        const r4 = await graphRequest('GET', `v26.0/${wabaId}?fields=id`, token);
        console.log('v26.0 basic:', JSON.stringify(r4, null, 2));
    } catch(e) { console.log('Error:', e); }
}

test().catch(err => { console.error(err); process.exit(1); });