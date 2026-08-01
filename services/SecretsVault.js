/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SECRET_KEYS = [
    'googleApiKey',
    'openrouterApiKey',
    'perplexityApiKey',
    'apiKey',
    'githubToken'
];

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/**
 * AES-256-GCM encrypted secrets store under ~/.lorapok.
 * Key material: random keyfile (0600) + optional LORAPOK_MASTER_PASSPHRASE.
 */
class SecretsVault {
    /**
     * @param {string|null} [configDir=null]
     */
    constructor(configDir = null) {
        this.configDir = configDir || path.join(os.homedir(), '.lorapok');
        this.vaultFile = path.join(this.configDir, 'secrets.enc');
        this.keyFile = path.join(this.configDir, '.master.key');
        this._cache = null;
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
        }
        try {
            fs.chmodSync(this.configDir, 0o700);
        } catch (_) { /* ignore */ }
    }

    /**
     * Load or create 32-byte master keyfile.
     * @returns {Buffer}
     */
    getOrCreateKeyfile() {
        this.ensureDir();
        if (fs.existsSync(this.keyFile)) {
            return fs.readFileSync(this.keyFile);
        }
        const key = crypto.randomBytes(32);
        fs.writeFileSync(this.keyFile, key, { mode: 0o600 });
        try { fs.chmodSync(this.keyFile, 0o600); } catch (_) { /* ignore */ }
        return key;
    }

    /**
     * Derive AES key from keyfile + optional passphrase.
     * @returns {Buffer}
     */
    deriveKey() {
        const keyfile = this.getOrCreateKeyfile();
        const passphrase = process.env.LORAPOK_MASTER_PASSPHRASE || '';
        const salt = crypto.createHash('sha256').update('lorapok-vault-v1').digest();
        return crypto.scryptSync(
            Buffer.concat([keyfile, Buffer.from(passphrase, 'utf8')]),
            salt,
            32,
            SCRYPT_PARAMS
        );
    }

    /**
     * @returns {Object}
     */
    load() {
        if (this._cache) return { ...this._cache };
        if (!fs.existsSync(this.vaultFile)) {
            this._cache = {};
            return {};
        }
        try {
            const raw = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8'));
            const key = this.deriveKey();
            const iv = Buffer.from(raw.iv, 'base64');
            const tag = Buffer.from(raw.tag, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);
            const dec = Buffer.concat([
                decipher.update(Buffer.from(raw.data, 'base64')),
                decipher.final()
            ]);
            this._cache = JSON.parse(dec.toString('utf8'));
            return { ...this._cache };
        } catch (e) {
            this._cache = {};
            return {};
        }
    }

    /**
     * @param {Object} secrets
     */
    save(secrets) {
        this.ensureDir();
        const key = this.deriveKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const payload = Buffer.from(JSON.stringify(secrets || {}), 'utf8');
        const enc = Buffer.concat([cipher.update(payload), cipher.final()]);
        const tag = cipher.getAuthTag();
        const out = {
            v: 1,
            alg: 'aes-256-gcm',
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            data: enc.toString('base64')
        };
        fs.writeFileSync(this.vaultFile, JSON.stringify(out), { mode: 0o600 });
        try { fs.chmodSync(this.vaultFile, 0o600); } catch (_) { /* ignore */ }
        this._cache = { ...(secrets || {}) };
    }

    /**
     * @param {string} name
     * @returns {string|null}
     */
    getSecret(name) {
        const secrets = this.load();
        const val = secrets[name];
        return val == null || val === '' ? null : String(val);
    }

    /**
     * @param {string} name
     * @param {string|null} value
     */
    setSecret(name, value) {
        const secrets = this.load();
        if (value == null || value === '') {
            delete secrets[name];
        } else {
            secrets[name] = String(value);
        }
        // Keep perplexity aliases in sync
        if (name === 'perplexityApiKey' && value) {
            secrets.apiKey = String(value);
        }
        if (name === 'apiKey' && value) {
            secrets.perplexityApiKey = secrets.perplexityApiKey || String(value);
        }
        this.save(secrets);
    }

    /**
     * Migrate plaintext keys from config object into vault; returns cleaned config.
     * @param {Object} config
     * @returns {{ config: Object, migrated: boolean }}
     */
    migrateFromConfig(config = {}) {
        const next = { ...config };
        let migrated = false;
        const secrets = this.load();
        for (const k of SECRET_KEYS) {
            if (next[k]) {
                if (!secrets[k]) secrets[k] = next[k];
                delete next[k];
                migrated = true;
            }
        }
        if (migrated) this.save(secrets);
        return { config: next, migrated };
    }

    /** Wipe vault contents (hard reset). */
    clear() {
        this.save({});
    }

    static get SECRET_KEYS() {
        return SECRET_KEYS.slice();
    }
}

module.exports = { SecretsVault, SECRET_KEYS };
