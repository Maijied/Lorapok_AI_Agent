/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const GitManager = require('../services/GitManager');
const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock agent-enhanced for server endpoints
jest.mock('../lib/agent-enhanced', () => {
    return {
        LorapokEnhancedAgent: jest.fn().mockImplementation(() => ({
            chat: jest.fn().mockResolvedValue({ success: true, content: 'API response' }),
            clearHistory: jest.fn()
        })),
        MODELS: { sonar: { name: 'Sonar' } }
    };
});

describe('Milestone 1 Adversarial Security & Quality Verification', () => {
    let testDir;
    let gm;

    beforeEach(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-m1-adversarial-'));
        gm = new GitManager(testDir);
    });

    afterEach(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    describe('GitManager Token Redaction - Empirical Findings', () => {
        test('Verify HTTPS basic auth URL token redaction', () => {
            const logs = [];
            gm.setLogger((cmd, out, succ) => logs.push({ cmd, out, succ }));
            gm.executeGit('remote add https_target https://user:secret_token_123@github.com/org/repo.git');

            expect(logs[0].cmd).not.toContain('secret_token_123');
            expect(logs[0].cmd).toContain('https://***@github.com/org/repo.git');
        });

        test('VULNERABILITY FINDING: HTTP basic auth URLs bypass token redaction', () => {
            const logs = [];
            gm.setLogger((cmd, out, succ) => logs.push({ cmd, out, succ }));
            gm.executeGit('remote add http_target http://user:http_secret_pass@github.com/org/repo.git');

            // http:// is NOT matched by /https:\/\/[^@\s]+@/gi
            const leaked = logs[0].cmd.includes('http_secret_pass');
            expect(leaked).toBe(true); // Demonstrates unhandled vulnerability in HTTP auth redaction
        });

        test('VULNERABILITY FINDING: PATs shorter than 16 chars bypass token redaction', () => {
            const logs = [];
            gm.setLogger((cmd, out, succ) => logs.push({ cmd, out, succ }));
            const shortToken = 'ghp_123456789012345'; // 15 chars after ghp_
            gm.executeGit(`config user.token ${shortToken}`);

            // Regex gh[pousr]_[A-Za-z0-9_]{16,} fails to match 15 char token
            const leaked = logs[0].cmd.includes(shortToken);
            expect(leaked).toBe(true); // Demonstrates pattern boundary vulnerability
        });

        test('VULNERABILITY FINDING: Basic auth password with "@" symbol causes partial leak', () => {
            const logs = [];
            gm.setLogger((cmd, out, succ) => logs.push({ cmd, out, succ }));
            gm.executeGit('remote add pass_with_at https://user:p@ssword123@github.com/org/repo.git');

            // [^@\s]+ stops at first @, replacing "https://user:p@" with "https://***@", leaving "ssword123@github.com..."
            const leakedPart = logs[0].cmd.includes('ssword123');
            expect(leakedPart).toBe(true); // Demonstrates regex greedy/delimiter flaw
        });

        test('Verify standard GitHub token prefixes (>=16 chars) redaction', () => {
            const logs = [];
            gm.setLogger((cmd, out, succ) => logs.push({ cmd, out, succ }));

            const sampleTokens = [
                'ghp_12345678901234567890',
                'gho_12345678901234567890',
                'ghu_12345678901234567890',
                'ghs_12345678901234567890',
                'ghr_12345678901234567890',
                'github_pat_11ABCDEF1234567890_1234567890123456789012345678901234567890'
            ];

            sampleTokens.forEach((tok, idx) => {
                gm.executeGit(`config user.testtoken${idx} ${tok}`);
                expect(logs[idx].cmd).not.toContain(tok);
            });
        });

        test('Verify GitManager error output redaction on failed commands', () => {
            const res = gm.executeGit('clone https://ghp_99999999999999999999@github.com/invalid_user/invalid_repo.git nonexistent_dir');

            expect(res.success).toBe(false);
            expect(res.error).not.toContain('ghp_99999999999999999999');
            expect(res.output).not.toContain('ghp_99999999999999999999');
        });
    });

    describe('server.js Session Deletion - Empirical Verification', () => {
        test('DELETE non-existent session returns 404', async () => {
            const res = await request(app).delete('/api/sessions/non_existent_session_id');
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ success: false, error: 'Session not found' });
        });

        test('DELETE existing session removes session and consecutive DELETE returns 404', async () => {
            // 1. Create session
            await request(app).post('/api/chat').send({ message: 'Hello', sessionId: 'session_del_test' });

            // 2. First delete succeeds
            const res1 = await request(app).delete('/api/sessions/session_del_test');
            expect(res1.status).toBe(200);
            expect(res1.body).toEqual({ success: true, deleted: true });

            // 3. Immediate second delete returns 404
            const res2 = await request(app).delete('/api/sessions/session_del_test');
            expect(res2.status).toBe(404);
            expect(res2.body).toEqual({ success: false, error: 'Session not found' });
        });

        test('Session recreation succeeds cleanly after deletion', async () => {
            // Create -> Delete -> Re-create
            await request(app).post('/api/chat').send({ message: 'Message 1', sessionId: 'session_recreate_test' });
            await request(app).delete('/api/sessions/session_recreate_test');

            const resNew = await request(app).post('/api/chat').send({ message: 'Message 2', sessionId: 'session_recreate_test' });
            expect(resNew.status).toBe(200);
            expect(resNew.body.success).toBe(true);
        });

        test('Server handles clearHistory exception gracefully with status 500', async () => {
            await request(app).post('/api/chat').send({ message: 'test', sessionId: 'session_err_test' });

            const { LorapokEnhancedAgent } = require('../lib/agent-enhanced');
            const mockAgent = LorapokEnhancedAgent.mock.results[LorapokEnhancedAgent.mock.results.length - 1].value;
            mockAgent.clearHistory.mockImplementationOnce(() => {
                throw new Error('Failed to purge agent history');
            });

            const res = await request(app).delete('/api/sessions/session_err_test');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ success: false, error: 'Failed to purge agent history' });
        });
    });
});
