/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
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
        jest.clearAllMocks();
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

        const response = await agent.chat('Explain recursion');
        expect(response.success).toBe(true);
        expect(response.content).toBe('This is a test response');
        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                messages: expect.arrayContaining([
                    expect.objectContaining({ role: 'user', content: 'Explain recursion' })
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

        await expect(agent.chat('Make a web app')).rejects.toThrow('Invalid API key');
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

    test('should intercept identity queries locally', async () => {
        const response1 = await agent.chat('Hi Lorapok');
        expect(response1.success).toBe(true);
        expect(response1.content).toContain('all programming languages');

        const response2 = await agent.chat('who created you');
        expect(response2.content).toContain('expert AI coding agent');

        const response3 = await agent.chat('what is your name');
        expect(response3.content).toContain('Lorapok');

        expect(axios.post).not.toHaveBeenCalled();
    });

    test('should route OpenRouter models to OpenRouter API endpoint with correct headers', async () => {
        agent.config.setOpenRouterApiKey('sk-or-v1-mock-key');

        axios.post.mockResolvedValue({
            data: {
                choices: [{ message: { content: 'OpenRouter response' } }]
            }
        });

        const response = await agent.callPerplexityAPI([{ role: 'user', content: 'test' }], 'anthropic/claude-3.5-sonnet');
        expect(response.success).toBe(true);
        expect(response.content).toBe('OpenRouter response');

        expect(axios.post).toHaveBeenCalledWith(
            'https://openrouter.ai/api/v1/chat/completions',
            expect.objectContaining({
                model: 'anthropic/claude-3.5-sonnet'
            }),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer sk-or-v1-mock-key',
                    'HTTP-Referer': 'https://lorapok.tech',
                    'X-Title': 'Lorapok AI Agent'
                })
            })
        );
    });
});
