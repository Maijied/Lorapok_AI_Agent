/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const { LorapokConfig } = require('../lib/config');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('LorapokConfig', () => {
    let testHome;
    let config;
    let originalHome;

    beforeEach(() => {
        testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-config-test-'));
        // Mock os.homedir
        jest.spyOn(os, 'homedir').mockReturnValue(testHome);
        config = new LorapokConfig();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(testHome, { recursive: true, force: true });
    });

    test('should initialize with default values', () => {
        expect(config.getModel()).toBe('sonar');
        expect(config.getLanguage()).toBe('javascript');
    });

    test('should save and load API key', () => {
        config.setApiKey('test-key');
        expect(config.getApiKey()).toBe('test-key');

        // New instance should load same key
        const config2 = new LorapokConfig();
        expect(config2.getApiKey()).toBe('test-key');
    });

    test('should clean dirty API keys (whitespace and quotes)', () => {
        config.setApiKey('  "pplx-dirty-key"  ');
        expect(config.getApiKey()).toBe('pplx-dirty-key');
    });

    test('should save and load model', () => {
        config.setModel('sonar-pro');
        expect(config.getModel()).toBe('sonar-pro');

        const config2 = new LorapokConfig();
        expect(config2.getModel()).toBe('sonar-pro');
    });

    test('should persist to correct directory', () => {
        config.setApiKey('abc');
        const configPath = path.join(testHome, '.lorapok', 'config.json');
        expect(fs.existsSync(configPath)).toBe(true);
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        expect(data.apiKey).toBe('abc');
    });
});
