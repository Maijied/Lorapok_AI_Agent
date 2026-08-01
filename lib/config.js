/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultThemeId } = require('./theme');
const { SecretsVault } = require('../services/SecretsVault');

/**
 * Manages agent configuration, preferences, and persistent storage.
 * API keys live in an encrypted vault (secrets.enc), not plaintext config.json.
 */
class LorapokConfig {
  /**
   * @param {string|null} [customDir=null] - Optional override directory path
   */
  constructor(customDir = null) {
    this.configDir = customDir || path.join(os.homedir(), '.lorapok');
    this.configFile = path.join(this.configDir, 'config.json');
    this.historyFile = path.join(this.configDir, 'history.json');
    this.vault = new SecretsVault(this.configDir);

    this.ensureConfigDir();
    this.config = this.loadConfig();
    this._migrateSecrets();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      try {
        fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
      } catch (e) {
        // Ignore errors during testing or read-only environments
      }
    }
  }

  loadConfig() {
    if (fs.existsSync(this.configFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
      } catch (error) {
        console.error('❌ Error reading config file');
        return {};
      }
    }
    return {};
  }

  saveConfig() {
    // Never persist secret fields in plaintext config
    const scrubbed = { ...this.config };
    for (const k of SecretsVault.SECRET_KEYS) {
      delete scrubbed[k];
    }
    this.config = scrubbed;
    fs.writeFileSync(this.configFile, JSON.stringify(scrubbed, null, 2), { mode: 0o600 });
    try { fs.chmodSync(this.configFile, 0o600); } catch (_) { /* ignore */ }
  }

  _migrateSecrets() {
    const { config, migrated } = this.vault.migrateFromConfig(this.config);
    if (migrated) {
      this.config = config;
      this.saveConfig();
    }
  }

  /**
   * Normalize key string (trim quotes / fix double pplx prefix).
   * @param {string|null} key
   * @returns {string|null}
   */
  _cleanKey(key) {
    if (!key) return null;
    let k = String(key).trim().replace(/^["'](.+)["']$/, '$1');
    if (k.startsWith('pplx-pplx-')) {
      k = k.replace(/^pplx-pplx-/, 'pplx-');
    }
    return k;
  }

  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  set(key, value) {
    if (SecretsVault.SECRET_KEYS.includes(key)) {
      this.vault.setSecret(key, value);
      delete this.config[key];
      this.saveConfig();
      return;
    }
    this.config[key] = value;
    this.saveConfig();
  }

  getApiKey() {
    return this.getPerplexityApiKey();
  }

  setApiKey(key) {
    this.setPerplexityApiKey(key);
  }

  getPerplexityApiKey() {
    const fromVault = this.vault.getSecret('perplexityApiKey') || this.vault.getSecret('apiKey');
    let key = fromVault || process.env.PERPLEXITY_API_KEY;
    return this._cleanKey(key);
  }

  setPerplexityApiKey(key) {
    const cleaned = this._cleanKey(key);
    this.vault.setSecret('perplexityApiKey', cleaned);
    this.vault.setSecret('apiKey', cleaned);
    delete this.config.perplexityApiKey;
    delete this.config.apiKey;
    this.saveConfig();
  }

  getOpenRouterApiKey() {
    const fromVault = this.vault.getSecret('openrouterApiKey');
    return this._cleanKey(fromVault || process.env.OPENROUTER_API_KEY);
  }

  setOpenRouterApiKey(key) {
    const cleaned = this._cleanKey(key);
    this.vault.setSecret('openrouterApiKey', cleaned);
    delete this.config.openrouterApiKey;
    this.saveConfig();
  }

  getGoogleApiKey() {
    const fromVault = this.vault.getSecret('googleApiKey');
    return this._cleanKey(fromVault || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  }

  setGoogleApiKey(key) {
    const cleaned = this._cleanKey(key);
    this.vault.setSecret('googleApiKey', cleaned);
    delete this.config.googleApiKey;
    this.saveConfig();
  }

  getGitHubToken() {
    const fromVault = this.vault.getSecret('githubToken');
    return fromVault || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || undefined;
  }

  setGitHubToken(token) {
    this.vault.setSecret('githubToken', token || null);
    delete this.config.githubToken;
    this.saveConfig();
  }

  getModel() {
    this.config = this.loadConfig();
    return process.env.LORAPOK_MODEL || this.config.model || 'gemini-flash-latest';
  }

  setModel(model) {
    this.set('model', model);
  }

  getLanguage() {
    return this.config.language || 'javascript';
  }

  setLanguage(lang) {
    this.set('language', lang);
  }

  getUserName() {
    return this.config.userName || null;
  }

  setUserName(name) {
    this.set('userName', name);
  }

  getBrandingFont() {
    const def = getDefaultThemeId();
    const font = this.config.brandingFont || this.config.theme || def;
    return font || def;
  }

  setBrandingFont(font) {
    this.set('brandingFont', font);
    this.set('theme', font);
  }

  /**
   * Logo style: 'classic' (default plump larva + AI Coding badge) or 'cyber' (laptop larva).
   * @returns {'cyber'|'classic'}
   */
  getLogoStyle() {
    const s = this.config.logoStyle || 'classic';
    return s === 'cyber' ? 'cyber' : 'classic';
  }

  /**
   * @param {'cyber'|'classic'|string} style
   */
  setLogoStyle(style) {
    this.set('logoStyle', style === 'cyber' ? 'cyber' : 'classic');
  }

  /**
   * Reset preferences to factory defaults.
   * Soft keeps vault secrets; hard clears vault + history.
   */
  resetToDefaults(options = {}) {
    const hard = Boolean(options.hard);

    const next = {
      brandingFont: getDefaultThemeId(),
      theme: getDefaultThemeId(),
      logoStyle: 'classic',
      model: null,
      language: 'javascript',
      autoApprove: false,
      cacheEnabled: true,
      userName: hard ? null : (this.config.userName || null)
    };

    this.config = next;
    this.saveConfig();

    if (hard) {
      this.vault.clear();
      if (fs.existsSync(this.historyFile)) {
        try { fs.writeFileSync(this.historyFile, '[]', 'utf8'); } catch (_) { /* ignore */ }
      }
    }

    return { hard, theme: next.brandingFont };
  }

  getAutoApprove() {
    return this.config.autoApprove === true || process.env.LORAPOK_AUTO_APPROVE === 'true';
  }

  setAutoApprove(enabled) {
    this.set('autoApprove', Boolean(enabled));
  }

  getCacheEnabled() {
    return this.config.cacheEnabled !== false && process.env.LORAPOK_CACHE !== 'false';
  }

  setCacheEnabled(enabled) {
    this.set('cacheEnabled', Boolean(enabled));
  }

  isFirstRun() {
    return !this.config.userName;
  }
}

module.exports = { LorapokConfig };
