/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Manages agent configuration, preferences, and persistent storage.
 */
class LorapokConfig {
  /**
   * @param {string|null} [customDir=null] - Optional override directory path
   */
  constructor(customDir = null) {
    this.configDir = customDir || path.join(os.homedir(), '.lorapok');
    this.configFile = path.join(this.configDir, 'config.json');
    this.historyFile = path.join(this.configDir, 'history.json');

    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  /**
   * Ensure directory exists for config storage.
   * @returns {void}
   */
  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      try {
        fs.mkdirSync(this.configDir, { recursive: true });
      } catch (e) {
        // Ignore errors during testing or read-only environments
      }
    }
  }

  /**
   * Load JSON configuration file contents.
   * @returns {Object} Config dictionary object
   */
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

  /**
   * Persist current config dictionary to JSON disk file.
   * @returns {void}
   */
  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  /**
   * Get specific configuration entry by key.
   * @param {string} key - Configuration key
   * @param {any} [defaultValue=null] - Default value fallback if key does not exist
   * @returns {any} Stored value or default fallback
   */
  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  /**
   * Set and persist configuration key value.
   * @param {string} key - Key name
   * @param {any} value - Value to store
   * @returns {void}
   */
  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * Get active Perplexity API Key.
   * @returns {string|null} API Key string or null if not set
   */
  getApiKey() {
    return this.getPerplexityApiKey();
  }

  /**
   * Set and save Perplexity API Key.
   * @param {string} key - New API key string
   * @returns {void}
   */
  setApiKey(key) {
    this.setPerplexityApiKey(key);
  }

  /**
   * Get active Perplexity API Key.
   * @returns {string|null} API Key string or null if not set
   */
  getPerplexityApiKey() {
    this.config = this.loadConfig();
    let key = this.config.perplexityApiKey || this.config.apiKey || process.env.PERPLEXITY_API_KEY;
    if (!key) return null;

    key = key.trim().replace(/^["'](.+)["']$/, '$1');
    if (key.startsWith('pplx-pplx-')) {
      key = key.replace(/^pplx-pplx-/, 'pplx-');
    }
    return key;
  }


  /**
   * Set and save Perplexity API Key.
   * @param {string} key - New API key string
   * @returns {void}
   */
  setPerplexityApiKey(key) {
    this.set('perplexityApiKey', key);
    this.set('apiKey', key);
  }

  /**
   * Get active OpenRouter API Key.
   * @returns {string|null} API Key string or null if not set
   */
  getOpenRouterApiKey() {
    this.config = this.loadConfig();
    let key = this.config.openrouterApiKey || process.env.OPENROUTER_API_KEY;
    if (!key) return null;

    key = key.trim().replace(/^["'](.+)["']$/, '$1');
    return key;
  }

  /**
   * Set and save OpenRouter API Key.
   * @param {string} key - New API key string
   * @returns {void}
   */
  setOpenRouterApiKey(key) {
    this.set('openrouterApiKey', key);
  }

  /**
   * Get active Google AI Studio (Gemini) API Key.
   * @returns {string|null} API Key string or null if not set
   */
  getGoogleApiKey() {
    this.config = this.loadConfig();
    let key = this.config.googleApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) return null;

    key = key.trim().replace(/^["'](.+)["']$/, '$1');
    return key;
  }

  /**
   * Set and save Google AI Studio API Key.
   * @param {string} key - New API key string
   * @returns {void}
   */
  setGoogleApiKey(key) {
    this.set('googleApiKey', key);
  }


  /**
   * Get active GitHub access token.
   * @returns {string|undefined} GitHub token string
   */
  getGitHubToken() {
    return this.config.githubToken || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  }

  /**
   * Set and save GitHub access token.
   * @param {string} token - GitHub token string
   * @returns {void}
   */
  setGitHubToken(token) {
    this.set('githubToken', token);
  }

  /**
   * Get currently active LLM model identifier.
   * @returns {string} Model ID (default: 'sonar')
   */
  getModel() {
    this.config = this.loadConfig();
    return process.env.LORAPOK_MODEL || this.config.model || 'sonar';
  }


  /**
   * Set active LLM model identifier.
   * @param {string} model - Target model ID
   * @returns {void}
   */
  setModel(model) {
    this.set('model', model);
  }

  /**
   * Get default coding language preference.
   * @returns {string} Language string
   */
  getLanguage() {
    return this.config.language || 'javascript';
  }

  /**
   * Set default coding language preference.
   * @param {string} lang - Language identifier string
   * @returns {void}
   */
  setLanguage(lang) {
    this.set('language', lang);
  }

  /**
   * Get user display name.
   * @returns {string|null} User display name or null
   */
  getUserName() {
    return this.config.userName || null;
  }

  /**
   * Set user display name.
   * @param {string} name - User display name
   * @returns {void}
   */
  setUserName(name) {
    this.set('userName', name);
  }

  /**
   * Get preferred Figlet branding font name.
   * @returns {string} Font name string
   */
  getBrandingFont() {
    return this.config.brandingFont || 'Big';
  }

  /**
   * Set preferred Figlet branding font name.
   * @param {string} font - Font name string
   * @returns {void}
   */
  setBrandingFont(font) {
    this.set('brandingFont', font);
  }

  /**
   * Get Auto-Approve / Bypass Mode setting.
   * @returns {boolean} True if Auto-Approve mode is enabled
   */
  getAutoApprove() {
    return this.config.autoApprove === true || process.env.LORAPOK_AUTO_APPROVE === 'true';
  }

  /**
   * Set Auto-Approve / Bypass Mode setting.
   * @param {boolean} enabled - True to enable auto-approve mode
   * @returns {void}
   */
  setAutoApprove(enabled) {
    this.set('autoApprove', Boolean(enabled));
  }

  /**
   * Check if LLM response caching is enabled.
   * @returns {boolean} True if response caching is enabled (default: true)
   */
  getCacheEnabled() {
    return this.config.cacheEnabled !== false && process.env.LORAPOK_CACHE !== 'false';
  }

  /**
   * Set LLM response caching enabled state.
   * @param {boolean} enabled - True to enable response caching
   * @returns {void}
   */
  setCacheEnabled(enabled) {
    this.set('cacheEnabled', Boolean(enabled));
  }

  /**
   * Check if application is running for the first time.
   * @returns {boolean} True if first run
   */
  isFirstRun() {
    return !this.config.userName;
  }
}


module.exports = { LorapokConfig };
