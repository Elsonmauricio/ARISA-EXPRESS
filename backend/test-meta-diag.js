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
            headers: {
                'Content-Type': 'application/json'
            }
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

    console.log('=== Meta API Diagnostics ===\n');

    // Check WABA
    console.log('--- WABA Info ---');
    const waba = await graphRequest('GET', `${wabaId}`, token);
    console.log(JSON.stringify(waba, null, 2));

    // Check token scopes
    console.log('\n--- Token Debug ---');
    const debugToken = await graphRequest('GET', `debug_token?input_token=${token}`, token);
    console.log(JSON.stringify(debugToken, null, 2));

    // Try listing message templates (this is the proper endpoint)
    console.log('\n--- Message Templates (GET) ---');
    const templates = await graphRequest('GET', `${wabaId}/message_templates`, token);
    console.log(JSON.stringify(templates, null, 2));

    // Try the exact payload the service sends
    console.log('\n--- Direct POST /messages (minimal) ---');
    const minimalPayload = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '351934292082',
        type: 'template',
        template: {
            name: 'encomenda_disponivel_lisboa',
            language: { code: 'pt_PT' }
        }
    });
    const postResult = await graphRequest('POST', `${wabaId}/messages`, token, minimalPayload);
    console.log(JSON.stringify(postResult, null, 2));

    // Check WhatsApp business account settings
    console.log('\n--- WABA Settings ---');
    try {
        const settings = await graphRequest('GET', `${wabaId}/whatsapp_business_account`, token);
        console.log(JSON.stringify(settings, null, 2));
    } catch(e) {
        console.log('Error:', e);
    }

    // Check business manager
    console.log('\n--- Business Info ---');
    const business = await graphRequest('GET', `${wabaId}/business_manager`, token);
    console.log(JSON.stringify(business, null, 2));
}

test().catch(err => { console.error(err); process.exit(1); });