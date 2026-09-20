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

    console.log('=== Final Meta API Tests ===\n');

    // Test 1: POST without messaging_product (should say required)
    console.log('--- Test 1: POST without messaging_product ---');
    try {
        const r1 = await graphRequest('POST', `${wabaId}/messages`, token, JSON.stringify({
            to: '351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r1, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 2: POST with messaging_product but minimal
    console.log('\n--- Test 2: POST minimal with messaging_product ---');
    try {
        const r2 = await graphRequest('POST', `${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            to: '351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r2, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 3: POST with messaging_product and components
    console.log('\n--- Test 3: POST with components ---');
    try {
        const r3 = await graphRequest('POST', `${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '351934292082',
            type: 'template',
            template: {
                name: 'encomenda_disponivel_lisboa',
                language: { code: 'pt_PT' },
                components: [{
                    type: 'body',
                    parameters: [{ type: 'text', text: 'Test Client' }]
                }]
            }
        }));
        console.log(JSON.stringify(r3, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 4: Check if the endpoint itself is the issue (try GET on messages)
    console.log('\n--- Test 4: GET /messages (should fail differently) ---');
    try {
        const r4 = await graphRequest('GET', `${wabaId}/messages`, token);
        console.log(JSON.stringify(r4, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 5: Check the app's Instagram messaging (different product)
    console.log('\n--- Test 5: Check app products ---');
    try {
        const r5 = await graphRequest('GET', `1619465439819703?fields=name,icon,namespace`, token);
        console.log(JSON.stringify(r5, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 6: Try with business_id in the URL
    console.log('\n--- Test 6: Check WABA with business_id ---');
    try {
        const r6 = await graphRequest('GET', `${wabaId}?fields=id,verified_name,display_phone_number,quality_rating,platform_type,code_verification_status,status,whatsapp_business_account_id`, token);
        console.log(JSON.stringify(r6, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 7: Try POST with v21.0 explicitly
    console.log('\n--- Test 7: POST via v21.0 ---');
    try {
        const r7 = await graphRequest('POST', `v21.0/${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r7, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 8: Try POST with v19.0 explicitly
    console.log('\n--- Test 8: POST via v19.0 ---');
    try {
        const r8 = await graphRequest('POST', `v19.0/${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r8, null, 2));
    } catch(e) { console.log('Error:', e); }

    // Test 9: Try POST with phone number in different format
    console.log('\n--- Test 9: POST with +prefix phone ---');
    try {
        const r9 = await graphRequest('POST', `${wabaId}/messages`, token, JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '+351934292082',
            type: 'template',
            template: { name: 'encomenda_disponivel_lisboa', language: { code: 'pt_PT' } }
        }));
        console.log(JSON.stringify(r9, null, 2));
    } catch(e) { console.log('Error:', e); }
}

test().catch(err => { console.error(err); process.exit(1); });