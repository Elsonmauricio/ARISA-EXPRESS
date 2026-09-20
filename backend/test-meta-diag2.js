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

    console.log('=== Additional Meta Diagnostics ===\n');

    // Check user's WABAs
    console.log('--- WABAs for token user ---');
    try {
        const wabas = await graphRequest('GET', `122100390051458391/owned_whatsapp_business_accounts`, token);
        console.log(JSON.stringify(wabas, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Check app's WABAs
    console.log('\n--- WABAs for app ---');
    try {
        const appWabas = await graphRequest('GET', `1619465439819703/owned_whatsapp_business_accounts`, token);
        console.log(JSON.stringify(appWabas, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Check business verification
    console.log('\n--- Business verification ---');
    try {
        const biz = await graphRequest('GET', `1619465439819703/business`, token);
        console.log(JSON.stringify(biz, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Check messaging product config
    console.log('\n--- Messaging config ---');
    try {
        const msgConfig = await graphRequest('GET', `${wabaId}/message_templates?access_token=${token}`, token);
        console.log(JSON.stringify(msgConfig, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Check resolved business
    console.log('\n--- Resolved Business ---');
    try {
        const resolved = await graphRequest('GET', `${wabaId}?fields=resolved_business`, token);
        console.log(JSON.stringify(resolved, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Check WABA with all fields
    console.log('\n--- WABA all fields ---');
    try {
        const allFields = await graphRequest('GET', `${wabaId}?fields=id,verified_name,display_phone_number,quality_rating,platform_type,code_verification_status,status,throughput,webhook_configuration,resolved_business,whatsapp_business_account_id,owner_business`, token);
        console.log(JSON.stringify(allFields, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }

    // Try with messaging_product in different position/format
    console.log('\n--- POST with different format ---');
    const altPayload = JSON.stringify({
        messaging_product: 'whatsapp',
        to: '351934292082',
        type: 'template',
        template: {
            name: 'encomenda_disponivel_lisboa',
            language: { code: 'pt_PT' },
            component: {
                type: 'body',
                parameters: [{ type: 'text', text: 'Test' }]
            }
        }
    });
    try {
        const altResult = await graphRequest('POST', `${wabaId}/messages`, token, altPayload);
        console.log(JSON.stringify(altResult, null, 2));
    } catch(e) {
        console.log('Error:', JSON.stringify(e));
    }
}

test().catch(err => { console.error(err); process.exit(1); });