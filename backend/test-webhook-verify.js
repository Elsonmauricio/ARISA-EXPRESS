const https = require('https');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`HTTP ${res.statusCode}`);
                console.log('Body:', data);
                resolve(data);
            });
        }).on('error', reject);
    });
}

async function test() {
    console.log('=== Webhook Verification (correct params) ===\n');

    // Correct param names with dots
    const url = 'https://arisa-backend.vercel.app/api/webhook/webhook?hub.mode=subscribe&hub.verify_token=arisa-express&hub.challenge=test_challenge_123';
    console.log('URL:', url);
    await httpsGet(url);
}

test().catch(console.error);