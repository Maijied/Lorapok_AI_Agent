const https = require('https');
require('dotenv').config();

const perplexityKey = process.env.PERPLEXITY_API_KEY;

function testModel(model) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ model, messages: [{ role: 'user', content: 'hello' }] });
        const req = https.request({
            hostname: 'api.perplexity.ai',
            path: '/chat/completions',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${perplexityKey}` }
        }, (res) => {
            resolve(res.statusCode);
        });
        req.write(data); req.end();
    });
}
testModel('fake-model-123').then(console.log);
