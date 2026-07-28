/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const path = require('path');
const os = require('os');
const { LorapokCodingAgent } = require('../lib/agent');
const { LorapokConfig } = require('../lib/config');
const { ModelManager, DEFAULT_GOOGLE_MODELS } = require('../services/ModelManager');
const axios = require('axios');

jest.mock('axios');

describe('Google AI Studio Provider Support', () => {
    let agent;
    let config;
    let modelManager;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;
        const tmpDir = path.join(os.tmpdir(), `lorapok-config-test-${Math.random().toString(36).substring(7)}`);
        config = new LorapokConfig(tmpDir);
        agent = new LorapokCodingAgent();
        agent.config = config;
        modelManager = new ModelManager(config);
    });

    test('should resolve Google API key from GEMINI_API_KEY environment variable', () => {
        process.env.GEMINI_API_KEY = 'test-gemini-key-123';
        expect(config.getGoogleApiKey()).toBe('test-gemini-key-123');
        delete process.env.GEMINI_API_KEY;
    });

    test('should resolve Google API key from GOOGLE_API_KEY fallback', () => {
        delete process.env.GEMINI_API_KEY;
        process.env.GOOGLE_API_KEY = 'test-google-key-456';
        expect(config.getGoogleApiKey()).toBe('test-google-key-456');
        delete process.env.GOOGLE_API_KEY;
    });

    test('should identify google-ai-studio provider for gemini, gemma, and agent models', () => {
        expect(agent.getProviderForModel('gemini-2.5-pro')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('gemini-2.0-flash')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('models/gemini-1.5-pro')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('gemma-4-31b-it')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('antigravity-preview-05-2026')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('deep-research-max-preview-04-2026')).toBe('google-ai-studio');
        expect(agent.getProviderForModel('google-ai-studio/custom')).toBe('google-ai-studio');
    });

    test('should dynamically fetch all models supporting generateContent including Gemma and Agent models', async () => {
        process.env.GEMINI_API_KEY = 'test-key';
        axios.get.mockResolvedValue({
            data: {
                models: [
                    {
                        name: 'models/gemini-3.6-flash',
                        displayName: 'Gemini 3.6 Flash',
                        description: 'Flagship fast model',
                        inputTokenLimit: 2000000,
                        supportedGenerationMethods: ['generateContent', 'countTokens']
                    },
                    {
                        name: 'models/gemma-4-31b-it',
                        displayName: 'Gemma 4 31B IT',
                        description: 'Open weights model',
                        inputTokenLimit: 128000,
                        supportedGenerationMethods: ['generateContent', 'countTokens']
                    },
                    {
                        name: 'models/antigravity-preview-05-2026',
                        displayName: 'Antigravity Agent Preview',
                        description: 'Autonomous coding model',
                        inputTokenLimit: 500000,
                        supportedGenerationMethods: ['generateContent']
                    },
                    {
                        name: 'models/embedding-001',
                        displayName: 'Embedding Model',
                        description: 'Text embedding only',
                        inputTokenLimit: 2048,
                        supportedGenerationMethods: ['embedContent']
                    }
                ]
            }
        });

        const googleModels = await modelManager.fetchGoogleModels('test-key');
        expect(googleModels['gemini-3.6-flash']).toBeDefined();
        expect(googleModels['gemma-4-31b-it']).toBeDefined();
        expect(googleModels['gemma-4-31b-it'].provider).toBe('google-ai-studio');
        expect(googleModels['antigravity-preview-05-2026']).toBeDefined();
        expect(googleModels['antigravity-preview-05-2026'].category).toBe('coding');
        
        // Embedding only model should be excluded from chat/generation catalog
        expect(googleModels['embedding-001']).toBeUndefined();
        delete process.env.GEMINI_API_KEY;
    });

    test('should fallback to DEFAULT_GOOGLE_MODELS if API call fails or no key provided', async () => {
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;
        const googleModels = await modelManager.fetchGoogleModels(null);
        expect(googleModels['gemini-3.6-flash']).toBeDefined();
        expect(googleModels['gemini-3.6-flash'].provider).toBe('google-ai-studio');
        expect(googleModels['gemini-3.5-flash-lite']).toBeDefined();
    });

    test('should execute chat API call using Google AI Studio OpenAI-compatible endpoint', async () => {
        config.setGoogleApiKey('AIzaSyTestKey123');
        agent.config = config;

        axios.post.mockResolvedValue({
            data: {
                choices: [
                    {
                        message: {
                            content: 'Hello from Gemini!'
                        }
                    }
                ],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 5,
                    total_tokens: 15
                }
            }
        });

        const result = await agent.callPerplexityAPI([{ role: 'user', content: 'Hello' }], 'gemini-2.5-flash');

        expect(result.success).toBe(true);
        expect(result.content).toBe('Hello from Gemini!');
        expect(axios.post).toHaveBeenCalledWith(
            'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            expect.objectContaining({
                model: 'gemini-2.5-flash',
                messages: [{ role: 'user', content: 'Hello' }]
            }),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer AIzaSyTestKey123',
                    'Content-Type': 'application/json'
                })
            })
        );
    });
});
