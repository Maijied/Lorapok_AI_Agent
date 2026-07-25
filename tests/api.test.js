/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const request = require('supertest');
const app = require('../server');
const { LorapokConfig } = require('../lib/config');

// Mock the agent-enhanced because it calls Perplexity API
jest.mock('../lib/agent-enhanced', () => {
    return {
        LorapokEnhancedAgent: jest.fn().mockImplementation(() => ({
            chat: jest.fn().mockResolvedValue({ success: true, content: 'API response' }),
            generateCode: jest.fn().mockResolvedValue({ success: true, content: 'code' }),
            analyzeCode: jest.fn().mockResolvedValue({ success: true, content: 'analysis' }),
            debugCode: jest.fn().mockResolvedValue({ success: true, content: 'fix' }),
            checkAvailableModels: jest.fn().mockResolvedValue({ sonar: { name: 'Sonar', available: true } }),
            listProjectFiles: jest.fn().mockReturnValue([{ path: 'test.js', type: 'file' }]),
            showFileTree: jest.fn().mockReturnValue('tree'),
            fileManager: {
                readFile: jest.fn().mockReturnValue('content')
            },
            clearHistory: jest.fn()
        })),
        MODELS: {
            sonar: { name: 'Sonar', tier: 'free', available: true }
        }
    };
});

describe('API Server', () => {
    test('GET /health should return status ok and branding credit', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.credit).toBe('Built with 🐛 by Lorapok Labs (https://lorapok.tech)');
    });

    test('POST /api/chat should return AI response', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: 'Hello', conversationId: '123' });

        expect(response.status).toBe(200);
        expect(response.body.content).toBe('API response');
    });

    test('GET /api/files should return file list', async () => {
        const response = await request(app).get('/api/files').query({ sessionId: '123' });
        expect(response.status).toBe(200);
        expect(response.body.files).toBeDefined();
        expect(Array.isArray(response.body.files)).toBe(true);
    });

    test('GET /api/models should return available models', async () => {
        const response = await request(app).get('/api/models').query({ sessionId: '123' });
        expect(response.status).toBe(200);
        // Server returns { models: ... }
        expect(response.body.models.sonar).toBeDefined();
    });

    test('DELETE /api/sessions/:sessionId should handle non-existent session with 404', async () => {
        const response = await request(app).delete('/api/sessions/non_existent_session_999');
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test('DELETE /api/sessions/:sessionId should clear existing session history and delete session', async () => {
        // Create session via chat request
        await request(app).post('/api/chat').send({ message: 'test', sessionId: 'active_sess_1' });
        
        const deleteRes = await request(app).delete('/api/sessions/active_sess_1');
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
        expect(deleteRes.body.deleted).toBe(true);

        // Deleting again should return 404
        const deleteRes2 = await request(app).delete('/api/sessions/active_sess_1');
        expect(deleteRes2.status).toBe(404);
    });
});
