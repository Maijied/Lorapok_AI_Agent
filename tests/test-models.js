const https = require('https');
require('dotenv').config();

const perplexityKey = process.env.PERPLEXITY_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

const perplexityModels = [
    'sonar',
    'sonar-pro',
    'sonar-reasoning',
    'sonar-reasoning-pro',
    'sonar-deep-research'
];

const openRouterModels = [
    'anthropic/claude-3.7-sonnet',
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-r1',
    'deepseek/deepseek-chat',
    'meta-llama/llama-3.3-70b-instruct',
    'qwen/qwen-2.5-coder-32b-instruct',
    'mistralai/mistral-large-2411',
    'openai/gpt-4o',
    'openai/o3-mini'
];

async function testModel(provider, model, key, hostname, path) {
    return new Promise((resolve) => {
        if (!key) {
            resolve({ model, status: 'No Key', error: 'No API Key' });
            return;
        }

        const data = JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 10
        });

        const req = https.request({
            hostname: hostname,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {
                    parsed = body;
                }
                resolve({ model, status: res.statusCode, body: parsed });
            });
        });

        req.on('error', (e) => {
            resolve({ model, status: 'Network Error', error: e.message });
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('Testing Perplexity Models:');
    for (const model of perplexityModels) {
        const res = await testModel('perplexity', model, perplexityKey, 'api.perplexity.ai', '/chat/completions');
        console.log(`- ${model}: ${res.status}`);
        if (res.status !== 200) console.log(JSON.stringify(res.body));
    }

    console.log('\nTesting OpenRouter Models:');
    for (const model of openRouterModels) {
        const res = await testModel('openrouter', model, openRouterKey, 'openrouter.ai', '/api/v1/chat/completions');
        console.log(`- ${model}: ${res.status}`);
        if (res.status !== 200) console.log(JSON.stringify(res.body));
    }
}

run();
