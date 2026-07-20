const { LorapokCodingAgent } = require('../lib/agent');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('axios');

describe('LorapokCodingAgent', () => {
    let agent;
    let testHome;

    beforeEach(() => {
        testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-agent-test-'));
        jest.spyOn(os, 'homedir').mockReturnValue(testHome);
        agent = new LorapokCodingAgent('fake-api-key');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(testHome, { recursive: true, force: true });
    });

    test('should call Perplexity API with correct parameters', async () => {
        axios.post.mockResolvedValue({
            data: {
                choices: [{ message: { content: 'This is a test response' } }],
                citations: []
            }
        });

        const response = await agent.chat('Run a test query');
        expect(response.success).toBe(true);
        expect(response.content).toBe('This is a test response');
        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                messages: expect.arrayContaining([
                    expect.objectContaining({ role: 'user', content: 'Run a test query' })
                ])
            }),
            expect.any(Object)
        );
    });

    test('should handle API errors', async () => {
        axios.post.mockRejectedValue({
            response: {
                status: 401,
                data: { error: { message: 'Unauthorized' } }
            }
        });

        await expect(agent.chat('Run a failure test')).rejects.toThrow('Invalid API key');
    });

    test('should probe models correctly', async () => {
        // Mock successful probe for sonar, fail for reasoning
        axios.post.mockImplementation((url, payload) => {
            if (payload.model === 'sonar') {
                return Promise.resolve({ data: {} });
            }
            return Promise.reject(new Error('Model not available'));
        });

        const results = await agent.checkAvailableModels();
        expect(results['sonar'].available).toBe(true);
        expect(results['sonar-reasoning'].available).toBe(false);
    });

    test('should maintain conversation history', async () => {
        axios.post.mockResolvedValue({
            data: {
                choices: [{ message: { content: 'Response' } }]
            }
        });

        await agent.chat('First');
        await agent.chat('Second');

        const history = agent.getHistory();
        expect(history.length).toBe(4); // 2 pairs of user/assistant
        expect(history[0].content).toBe('First');
        expect(history[1].content).toBe('Response');
    });
});
