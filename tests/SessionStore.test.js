'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { SessionStore } = require('../services/SessionStore');

describe('SessionStore', () => {
    let dir;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-sess-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    test('saves and loads session recap', () => {
        const store = new SessionStore(dir);
        store.save({
            id: 'ABCDEF12',
            count: 2,
            successRate: 100,
            tokens: { prompt: 10, completion: 5, total: 15 },
            modelUsage: {}
        });
        const loaded = store.load('ABCDEF12');
        expect(loaded).toBeTruthy();
        expect(loaded.count).toBe(2);
        expect(store.list().some(r => r.id === 'ABCDEF12')).toBe(true);
    });
});
