require('dotenv').config();
const { LorapokCodingAgent } = require('./agent');
const { LorapokConfig } = require('./config');

async function test() {
    console.log('🧪 Testing Lorapok Agent...\n');

    const config = new LorapokConfig();
    const apiKey = config.getApiKey() || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        console.error('❌ No API key found!');
        console.error('   Add PERPLEXITY_API_KEY to .env or run: node index.js setup');
        process.exit(1);
    }

    console.log('✅ API key found');
    console.log('📦 Model:', config.getModel());
    console.log('🔤 Language:', config.getLanguage());
    console.log('');

    const agent = new LorapokCodingAgent(apiKey);

    console.log('🔌 Testing API connection...\n');

    try {
        const response = await agent.chat('Hello! What is 2+2? Keep your answer very brief.');
        console.log('✅ Agent works!\n');
        console.log('📨 Response:', response.content);
        console.log('');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

test();
