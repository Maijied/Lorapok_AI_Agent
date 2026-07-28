/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const LorapokCache = require('../lib/cache');

describe('LorapokCache Response Engine', () => {
    let cache;

    beforeEach(() => {
        cache = new LorapokCache({ enabled: true, ttl: 3600 });
        cache.clear();
    });

    afterEach(() => {
        cache.clear();
    });

    test('should generate deterministic cache key from payload', () => {
        const messages = [{ role: 'user', content: 'test query' }];
        const key1 = cache.generateKey(messages, 'sonar', 0.2);
        const key2 = cache.generateKey(messages, 'sonar', 0.2);
        expect(key1).toBe(key2);
        expect(typeof key1).toBe('string');
        expect(key1).toHaveLength(64);
    });

    test('should return null on cache miss', () => {
        const result = cache.get('non-existent-key');
        expect(result).toBeNull();
    });

    test('should cache response payload and record cache hit', () => {
        const messages = [{ role: 'user', content: 'hello' }];
        const key = cache.generateKey(messages, 'sonar', 0.2);
        const responseData = {
            success: true,
            content: 'Hello developer!',
            usage: { total_tokens: 150 }
        };

        const setRes = cache.set(key, responseData);
        expect(setRes).toBe(true);

        const cached = cache.get(key);
        expect(cached).not.toBeNull();
        expect(cached.content).toBe('Hello developer!');
        expect(cached.cached).toBe(true);

        const stats = cache.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.tokensSaved).toBe(150);
    });

    test('should disable cache when setEnabled is false', () => {
        cache.setEnabled(false);
        const key = 'disabled-test';
        cache.set(key, { success: true, content: 'data' });

        const result = cache.get(key);
        expect(result).toBeNull();
        expect(cache.getStats().enabled).toBe(false);
    });

    test('should clear cache entries and reset stats', () => {
        const key = 'flush-test';
        cache.set(key, { success: true, content: 'flush' });
        cache.get(key);

        cache.clear();
        const stats = cache.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.itemCount).toBe(0);
        expect(stats.tokensSaved).toBe(0);
    });
});
