const LorapokHistory = require('../lib/history');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('LorapokHistory', () => {
    let testHome;
    let history;

    beforeEach(() => {
        testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-history-test-'));
        jest.spyOn(os, 'homedir').mockReturnValue(testHome);
        history = new LorapokHistory();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(testHome, { recursive: true, force: true });
    });

    test('should start with empty history', () => {
        expect(history.getAll()).toEqual([]);
    });

    test('should add entries and persist them', () => {
        history.add('chat', 'hello', 'hi there', 'sonar-pro');
        const all = history.getAll();
        expect(all.length).toBe(1);
        expect(all[0].input).toBe('hello');
        expect(all[0].output).toBe('hi there');

        // New instance should load same history
        const history2 = new LorapokHistory();
        expect(history2.getAll().length).toBe(1);
    });

    test('should clear history', () => {
        history.add('chat', 'q', 'a', 'm');
        history.clear();
        expect(history.getAll()).toEqual([]);

        const history2 = new LorapokHistory();
        expect(history2.getAll()).toEqual([]);
    });
});
