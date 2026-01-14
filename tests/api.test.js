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
            }
        })),
        MODELS: {
            sonar: { name: 'Sonar', tier: 'free', available: true }
        }
    };
});

describe('API Server', () => {
    test('GET /health should return status ok', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
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
});
