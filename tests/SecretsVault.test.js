'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { SecretsVault } = require('../services/SecretsVault');

describe('SecretsVault', () => {
    let dir;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-vault-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    test('round-trips secrets with AES-GCM', () => {
        const vault = new SecretsVault(dir);
        vault.setSecret('googleApiKey', 'AIza-test-key');
        expect(vault.getSecret('googleApiKey')).toBe('AIza-test-key');
        expect(fs.existsSync(path.join(dir, 'secrets.enc'))).toBe(true);
        expect(fs.existsSync(path.join(dir, '.master.key'))).toBe(true);
        const raw = fs.readFileSync(path.join(dir, 'secrets.enc'), 'utf8');
        expect(raw).not.toContain('AIza-test-key');
    });

    test('migrateFromConfig strips plaintext keys', () => {
        const vault = new SecretsVault(dir);
        const { config, migrated } = vault.migrateFromConfig({
            googleApiKey: 'g-key',
            model: 'gemini-flash-latest'
        });
        expect(migrated).toBe(true);
        expect(config.googleApiKey).toBeUndefined();
        expect(config.model).toBe('gemini-flash-latest');
        expect(vault.getSecret('googleApiKey')).toBe('g-key');
    });
});
