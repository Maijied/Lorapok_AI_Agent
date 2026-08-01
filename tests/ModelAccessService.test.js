'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');

describe('ModelAccessService', () => {
    let service;
    let tmpCache;

    beforeEach(() => {
        jest.restoreAllMocks();
        tmpCache = path.join(os.tmpdir(), `lorapok-access-${Date.now()}-${Math.random()}.json`);
        const ModelAccessService = require('../services/ModelAccessService').ModelAccessService;
        service = new ModelAccessService({ cacheFile: tmpCache, ttlMs: 60000 });
    });

    afterEach(() => {
        try { if (fs.existsSync(tmpCache)) fs.unlinkSync(tmpCache); } catch (_) { /* ignore */ }
    });

    test('classifyHttpResult maps statuses', () => {
        expect(service.classifyHttpResult(200)).toBe('accessible');
        expect(service.classifyHttpResult(429)).toBe('rate_limited');
        expect(service.classifyHttpResult(404, 'no longer available')).toBe('unavailable');
        expect(service.classifyHttpResult(402, 'credits required')).toBe('locked');
        expect(service.classifyHttpResult(500)).toBe('error');
    });

    test('setAccessState persists and canSelect works', () => {
        service.setAccessState('sonar', 'accessible', 'OK');
        expect(service.getAccessState('sonar')).toBe('accessible');
        expect(service.canSelect('sonar')).toBe(true);
        service.setAccessState('dead', 'unavailable', '404');
        expect(service.canSelect('dead')).toBe(false);
    });

    test('probeModel without key marks locked', async () => {
        const r = await service.probeModel('sonar-pro', {});
        expect(r.state).toBe('locked');
    });

    test('verifyProviderKey rejects empty key', async () => {
        const r = await service.verifyProviderKey('perplexity', '');
        expect(r.connected).toBe(false);
        expect(r.state).toBe('locked');
    });

    test('verifyProviderKey reports connection success for Perplexity', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: { choices: [] } });
        const r = await service.verifyProviderKey('perplexity', 'pplx-test');
        expect(r.connected).toBe(true);
        expect(r.ok).toBe(true);
        expect(r.state).toBe('accessible');
        expect(r.detail).toMatch(/accepted/i);
        expect(axios.post).toHaveBeenCalled();
        const payload = axios.post.mock.calls[0][1];
        expect(payload.max_tokens).toBeGreaterThanOrEqual(16);
    });

    test('probeModel sends max_tokens >= 16 (Perplexity floor)', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: { choices: [] } });
        await service.probeModel('sonar', { perplexityKey: 'pplx-test' });
        expect(axios.post).toHaveBeenCalled();
        const payload = axios.post.mock.calls[0][1];
        expect(payload.max_tokens).toBeGreaterThanOrEqual(16);
        expect(payload.max_tokens).toBe(require('../services/ModelAccessService').PROBE_MAX_TOKENS);
    });

    test('classifyHttpResult treats max_tokens 400 as error not locked', () => {
        expect(service.classifyHttpResult(400, 'max_tokens must be at least 16')).toBe('error');
        expect(service.classifyHttpResult(401, 'Invalid API key')).toBe('locked');
    });

    test('verifyProviderKey reports auth failure', async () => {
        const err = Object.assign(new Error('Unauthorized'), {
            response: { status: 401, data: { error: { message: 'Invalid API key' } } }
        });
        jest.spyOn(axios, 'post').mockRejectedValue(err);
        const r = await service.verifyProviderKey('perplexity', 'pplx-bad');
        expect(r.connected).toBe(false);
        expect(r.state).toBe('locked');
        expect(r.detail).toMatch(/Invalid API key/i);
    });

    test('verifyProviderKey OpenRouter uses models list endpoint', async () => {
        jest.spyOn(axios, 'get').mockResolvedValue({
            status: 200,
            data: { data: [{ id: 'x' }, { id: 'y' }] }
        });
        const r = await service.verifyProviderKey('openrouter', 'sk-or-v1-test');
        expect(r.connected).toBe(true);
        expect(r.detail).toMatch(/2 models/i);
        expect(axios.get).toHaveBeenCalledWith(
            'https://openrouter.ai/api/v1/models',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer sk-or-v1-test' })
            })
        );
    });

    test('verifyProviderKey Google uses models list endpoint', async () => {
        jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: { models: [] } });
        const r = await service.verifyProviderKey('google-ai-studio', 'AIzaSyTest');
        expect(r.connected).toBe(true);
        expect(r.detail).toMatch(/accepted/i);
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.any(Object)
        );
    });
});
