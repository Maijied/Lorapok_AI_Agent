/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const axios = require('axios');
const NodeCache = require('node-cache');
const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('../lib/logger');
const modelValidator = require('./ModelValidator');
const modelCacheService = require('./ModelCacheService');
const modelAccessService = require('./ModelAccessService');

/**
 * Expertise categories definitions.
 */
const CATEGORIES = {
    CODING: { id: 'coding', name: '💻 Coding & Engineering', description: 'Specialized for code generation, debugging, refactoring, and architecture.' },
    REASONING: { id: 'reasoning', name: '🔬 Complex Logic & Reasoning', description: 'Advanced step-by-step reasoning, mathematical & algorithmic analysis.' },
    RESEARCH: { id: 'research', name: '🔍 Web Research & Search', description: 'Live web search, citation lookup, and deep topic research.' },
    AGENT: { id: 'agent', name: '🤖 Autonomous Agents & Tools', description: 'Autonomous coding agents, tool use, and computer use models.' },
    IMAGE: { id: 'image', name: '🎨 Image & Visual Generation', description: 'Image generation, editing, and visual creation models.' },
    AUDIO: { id: 'audio', name: '🎙️ Audio & Voice Synthesis', description: 'Text-to-speech, audio generation, and voice synthesis.' },
    VIDEO: { id: 'video', name: '🎬 Video Generation', description: 'Video creation and motion generation models.' },
    OPENWEIGHTS: { id: 'openweights', name: '🦙 Open Weights & Open Source', description: 'Open-weights models like Gemma, Llama, and Mistral.' },
    FAST: { id: 'fast', name: '🚀 Fast & Lightweight', description: 'High speed, low latency, ideal for quick iterations and minor tasks.' },
    GENERAL: { id: 'general', name: '🌐 General Intelligence', description: 'All-round strong performance across versatile multimodal tasks.' }
};

/**
 * Default Perplexity models categorized by expertise.
 */
const DEFAULT_PERPLEXITY_MODELS = {
    // Official Sonar API models (https://docs.perplexity.ai/docs/sonar/models) — no large public list API.
    'sonar': { name: '⚡ Sonar (Perplexity)', category: ['fast', 'research'], provider: 'perplexity', tier: 'free', contextLength: 127000, rateLimit: 'Standard Tier (127k ctx)', description: 'Lightweight web-grounded search model.' },
    'sonar-pro': { name: '🎯 Sonar Pro (Perplexity)', category: ['research', 'coding'], provider: 'perplexity', tier: 'pro', contextLength: 200000, rateLimit: 'Pro Tier (200k ctx)', description: 'Advanced search with deeper grounding and follow-ups.' },
    'sonar-reasoning-pro': { name: '🔬 Sonar Reasoning Pro (Perplexity)', category: ['reasoning', 'research', 'coding'], provider: 'perplexity', tier: 'pro', contextLength: 127000, rateLimit: 'Pro Tier (127k ctx)', description: 'Chain-of-thought reasoning with live web search (replaces deprecated sonar-reasoning).' },
    'sonar-deep-research': { name: '🔍 Sonar Deep Research (Perplexity)', category: ['research', 'reasoning'], provider: 'perplexity', tier: 'pro', contextLength: 200000, rateLimit: 'Pro Tier (200k ctx)', description: 'Exhaustive multi-source research reports.' }
};

/**
 * Default OpenRouter models fallback when API is unreachable.
 */
/**
 * Default OpenRouter models fallback when API is unreachable.
 * All model IDs below are verified to exist on OpenRouter as of 2025/2026.
 * Free-tier models have daily rate limits. Pro models require OpenRouter credits.
 */
const DEFAULT_OPENROUTER_MODELS = {
    // OpenRouter Auto-Router
    'openrouter/auto': { name: '🤖 OpenRouter Auto', category: ['general'], provider: 'openrouter', tier: 'pro', contextLength: 128000, rateLimit: 'Varies', resetWindow: 'Realtime', description: 'Automatically routes requests to the best available model for the task.' },
    // Google via OpenRouter
    'google/gemini-2.0-flash-001': { name: '⚡ Gemini 2.0 Flash (OpenRouter)', category: ['fast', 'coding', 'research'], provider: 'openrouter', tier: 'free', contextLength: 1000000, rateLimit: '1M ctx | Free (limited)', resetWindow: '1m/24h', description: 'Google Gemini 2.0 Flash — fast multimodal with native tool use and search grounding.' },
    'google/gemini-2.5-pro': { name: '💎 Gemini 2.5 Pro (OpenRouter)', category: ['reasoning', 'coding', 'general'], provider: 'openrouter', tier: 'pro', contextLength: 2000000, rateLimit: '2M ctx | $1.25/M', resetWindow: 'Realtime', description: 'Google most capable flagship for complex reasoning and long-context tasks.' },
    // Anthropic via OpenRouter (verified IDs)
    'anthropic/claude-3.5-sonnet': { name: '🎭 Claude 3.5 Sonnet (OpenRouter)', category: ['coding', 'reasoning'], provider: 'openrouter', tier: 'pro', contextLength: 200000, rateLimit: '200k ctx | $3.00/M', resetWindow: 'Realtime', description: 'Anthropic best-in-class coding, reasoning, and instruction-following model.' },
    'anthropic/claude-3.5-haiku': { name: '⚡ Claude 3.5 Haiku (OpenRouter)', category: ['fast', 'coding'], provider: 'openrouter', tier: 'pro', contextLength: 200000, rateLimit: '200k ctx | $0.80/M', resetWindow: 'Realtime', description: 'Fast and affordable Claude model, ideal for lightweight tasks and quick responses.' },
    'anthropic/claude-opus-4': { name: '🎭 Claude Opus 4 (OpenRouter)', category: ['coding', 'reasoning', 'agent'], provider: 'openrouter', tier: 'pro', contextLength: 200000, rateLimit: '200k ctx | $15.00/M', resetWindow: 'Realtime', description: 'Most intelligent Claude model for highly complex tasks and autonomous agents.' },
    // DeepSeek via OpenRouter
    'deepseek/deepseek-r1': { name: '🧬 DeepSeek R1 (OpenRouter)', category: ['reasoning', 'coding', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 164000, rateLimit: '164k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Open-weights reasoning flagship with transparent chain-of-thought reasoning.' },
    'deepseek/deepseek-r1-distill-llama-70b': { name: '🧬 DeepSeek R1 Distill 70B (OpenRouter)', category: ['reasoning', 'fast', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 128000, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Distilled DeepSeek R1 reasoning into Llama 70B — faster, still strong at reasoning.' },
    'deepseek/deepseek-chat-v3-0324': { name: '🧬 DeepSeek V3 (OpenRouter)', category: ['coding', 'fast', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 128000, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'High performance open-weights coding and general intelligence engine.' },
    // Meta Llama via OpenRouter
    'meta-llama/llama-3.3-70b-instruct': { name: '🦙 Llama 3.3 70B Instruct (OpenRouter)', category: ['openweights', 'general', 'fast'], provider: 'openrouter', tier: 'free', contextLength: 131072, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Meta state-of-the-art open-weights instruction model.' },
    'meta-llama/llama-4-maverick': { name: '🦙 Llama 4 Maverick (OpenRouter)', category: ['openweights', 'general', 'fast'], provider: 'openrouter', tier: 'free', contextLength: 131072, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Meta Llama 4 Maverick — efficient multimodal open-weights model.' },
    'meta-llama/llama-4-scout': { name: '🦙 Llama 4 Scout (OpenRouter)', category: ['openweights', 'fast'], provider: 'openrouter', tier: 'free', contextLength: 131072, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Meta Llama 4 Scout — lightweight fast multimodal model with long context.' },
    // Qwen via OpenRouter
    'qwen/qwen-2.5-coder-32b-instruct': { name: '🐉 Qwen 2.5 Coder 32B (OpenRouter)', category: ['coding', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 32768, rateLimit: '32k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Specialized open-weights coding model, strong at code completion and generation.' },
    'qwen/qwen3-235b-a22b': { name: '🐉 Qwen3 235B A22B (OpenRouter)', category: ['reasoning', 'coding', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 40960, rateLimit: '40k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Qwen3 MoE flagship with hybrid thinking mode — strong at math, code, and reasoning.' },
    'qwen/qwen3-30b-a3b': { name: '🐉 Qwen3 30B A3B (OpenRouter)', category: ['reasoning', 'fast', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 40960, rateLimit: '40k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Smaller Qwen3 MoE — fast thinking model ideal for coding and quick tasks.' },
    // Mistral via OpenRouter
    'mistralai/mistral-large-2407': { name: '🌪️ Mistral Large 2407 (OpenRouter)', category: ['reasoning', 'coding'], provider: 'openrouter', tier: 'pro', contextLength: 128000, rateLimit: '128k ctx | $2.00/M', resetWindow: 'Realtime', description: 'Mistral flagship reasoning and multilingual model.' },
    'mistralai/mistral-nemo': { name: '🌪️ Mistral Nemo (OpenRouter)', category: ['fast', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 131072, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Apache 2.0 licensed efficient model, fast and capable for everyday tasks.' },
    // OpenAI via OpenRouter
    'openai/gpt-4o': { name: '⚡ GPT-4o (OpenRouter)', category: ['general', 'coding'], provider: 'openrouter', tier: 'pro', contextLength: 128000, rateLimit: '128k ctx | $2.50/M', resetWindow: 'Realtime', description: 'OpenAI flagship multimodal model — strong at vision, code, and reasoning.' },
    'openai/gpt-4o-mini': { name: '⚡ GPT-4o Mini (OpenRouter)', category: ['fast', 'general'], provider: 'openrouter', tier: 'pro', contextLength: 128000, rateLimit: '128k ctx | $0.15/M', resetWindow: 'Realtime', description: 'Cost-efficient OpenAI model for lightweight tasks and fast inference.' },
    'openai/o3-mini': { name: '🔬 OpenAI o3-mini (OpenRouter)', category: ['reasoning', 'coding', 'fast'], provider: 'openrouter', tier: 'pro', contextLength: 200000, rateLimit: '200k ctx | $1.10/M', resetWindow: 'Realtime', description: 'OpenAI high-speed reasoning model for math, science, and complex problem solving.' },
    'openai/o4-mini': { name: '🔬 OpenAI o4-mini (OpenRouter)', category: ['reasoning', 'coding', 'fast'], provider: 'openrouter', tier: 'pro', contextLength: 200000, rateLimit: '200k ctx | $1.10/M', resetWindow: 'Realtime', description: 'Latest OpenAI fast reasoning model with strong STEM performance.' },
    // xAI Grok via OpenRouter
    'x-ai/grok-3-beta': { name: '🚀 Grok 3 Beta (OpenRouter)', category: ['reasoning', 'coding', 'general'], provider: 'openrouter', tier: 'pro', contextLength: 131072, rateLimit: '128k ctx | $3.00/M', resetWindow: 'Realtime', description: 'xAI Grok 3 — strong reasoning, real-time knowledge, and coding capabilities.' },
    'x-ai/grok-3-mini-beta': { name: '🚀 Grok 3 Mini Beta (OpenRouter)', category: ['reasoning', 'fast'], provider: 'openrouter', tier: 'pro', contextLength: 131072, rateLimit: '128k ctx | $0.30/M', resetWindow: 'Realtime', description: 'Efficient Grok 3 reasoning model — great value for thinking-intensive tasks.' },
    // MoonShot Kimi via OpenRouter
    'moonshotai/kimi-k2': { name: '🌙 Kimi K2 (OpenRouter)', category: ['coding', 'agent', 'openweights'], provider: 'openrouter', tier: 'free', contextLength: 131072, rateLimit: '128k ctx | Free (limited)', resetWindow: '1m/24h', description: 'Moonshot Kimi K2 — MoE agentic model optimized for coding and tool use.' }
};

/**
 * Default Google AI Studio models — verified real model IDs as of 2025/2026.
 * Only models confirmed to exist on the Google AI Studio generativelanguage API are listed here.
 * These serve as the static fallback when the dynamic API fetch is unavailable.
 */
const DEFAULT_GOOGLE_MODELS = {
    // Emergency offline stubs only — prefer live ListModels. IDs verified usable for new keys (2026-08).
    'gemini-flash-latest': { name: '⚡ Gemini Flash Latest (Google AI Studio)', category: ['fast', 'coding', 'general'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: 'Free API | 1M ctx', description: 'Rolling latest Flash alias for chat.' },
    'gemini-flash-lite-latest': { name: '🚀 Gemini Flash-Lite Latest (Google AI Studio)', category: ['fast', 'general'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: 'Free API | 1M ctx', description: 'Rolling latest Flash-Lite alias.' },
    'gemini-3.5-flash': { name: '⚡ Gemini 3.5 Flash (Google AI Studio)', category: ['fast', 'reasoning', 'coding'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: 'Free API | 1M ctx', description: 'Current-generation fast multimodal chat model.' },
    'gemini-3.5-flash-lite': { name: '🚀 Gemini 3.5 Flash-Lite (Google AI Studio)', category: ['fast', 'general'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: 'Free API | 1M ctx', description: 'Lightweight high-throughput chat model.' },
    'gemini-3.6-flash': { name: '⚡ Gemini 3.6 Flash (Google AI Studio)', category: ['fast', 'coding', 'general'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: 'Free API | 1M ctx', description: 'Newer Flash generation for coding agents.' },
    'gemini-2.0-flash': { name: '⚡ Gemini 2.0 Flash (Google AI Studio)', category: ['fast', 'research', 'coding'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: '15 RPM | 1M TPM | 1M ctx', description: 'Stable 2.0 Flash production chat model.' },
    'gemini-2.0-flash-lite': { name: '🚀 Gemini 2.0 Flash-Lite (Google AI Studio)', category: ['fast', 'general'], provider: 'google-ai-studio', tier: 'free', contextLength: 1000000, rateLimit: '30 RPM | 1M TPM | 1M ctx', description: 'Cost-efficient 2.0 Flash-Lite.' },
    'gemini-2.5-pro': { name: '💎 Gemini 2.5 Pro (Google AI Studio)', category: ['reasoning', 'coding', 'general'], provider: 'google-ai-studio', tier: 'pro', contextLength: 2000000, rateLimit: '2 RPM | 32k TPM | 2M ctx', description: 'Higher-capacity Pro (rate-limited free API).' }
};

/**
 * Service managing LLM model fetching, caching, and expertise categorization.
 */
class ModelManager {
    /**
     * @param {Object} [config=null] - LorapokConfig instance
     */
    constructor(config = null) {
        this.config = config;
        this.cache = new NodeCache({ stdTTL: 3600 });
        this.openrouterEndpoint = 'https://openrouter.ai/api/v1/models';
    }

    /**
     * Categorize a model into an expertise category based on ID, name, or description.
     * @param {string} modelId - Model ID string
     * @param {string} [name=''] - Display name
     * @param {string} [description=''] - Model description text
     * @returns {'coding'|'reasoning'|'research'|'fast'|'general'} Category ID string
     */
    /**
     * Categorize a model into an expertise category based on ID, name, or description.
     * @param {string} modelId - Model ID string
     * @param {string} [name=''] - Display name
     * @param {string} [description=''] - Model description text
     * @returns {'coding'|'reasoning'|'research'|'fast'|'general'} Category ID string
     */
    /**
     * Sanitize a model ID by stripping API-specific prefixes.
     * @param {string} modelId - Raw model ID from API response
     * @returns {string} Clean model ID
     */
    sanitizeModelId(modelId) {
        if (!modelId) return '';
        return String(modelId)
            .replace(/^models\//, '')
            .replace(/^google-ai-studio\//, '')
            .trim();
    }

    /**
     * Classify payment vs rate-limit access for a model.
     * Google AI Studio free-API models are never paymentRequired (even "Pro" capacity).
     * @param {string} modelId
     * @param {Object} [meta={}]
     * @param {Object|null} [pricing=null]
     * @returns {{ paymentRequired: boolean, rateLimited: boolean, tier: 'free'|'pro' }}
     */
    classifyAccess(modelId, meta = {}, pricing = null) {
        const id = this.sanitizeModelId(modelId || meta.id || '');
        const idLower = id.toLowerCase();
        const provider = meta.provider || this.getProviderForModel(id);
        const rateStr = String(meta.rateLimit || '').toLowerCase();
        const nameStr = String(meta.name || id || '').toLowerCase();

        if (provider === 'google-ai-studio') {
            const rateLimited = idLower.includes('-pro') || idLower.includes('ultra') ||
                idLower.includes('exp-') || rateStr.includes('2 rpm') || meta.tier === 'pro';
            return { paymentRequired: false, rateLimited: Boolean(rateLimited), tier: 'free' };
        }

        if (provider === 'openrouter') {
            const p = pricing || meta.pricing;
            const hasPricing = Boolean(p && (p.prompt != null || p.completion != null));
            let pPrice = 0;
            let cPrice = 0;
            if (hasPricing) {
                pPrice = p.prompt != null ? parseFloat(p.prompt) * 1000000 : 0;
                cPrice = p.completion != null ? parseFloat(p.completion) * 1000000 : 0;
            }
            const explicitlyFree = idLower.endsWith(':free') || nameStr.includes(':free') ||
                (hasPricing && pPrice === 0 && cPrice === 0) ||
                (rateStr.includes('| free') && !rateStr.includes('$'));
            if (explicitlyFree || meta.tier === 'free') {
                return { paymentRequired: false, rateLimited: true, tier: 'free' };
            }
            if (meta.tier === 'pro' || rateStr.includes('$') || (hasPricing && (pPrice > 0 || cPrice > 0))) {
                return { paymentRequired: true, rateLimited: false, tier: 'pro' };
            }
            return { paymentRequired: true, rateLimited: false, tier: 'pro' };
        }

        if (provider === 'perplexity') {
            // Perplexity API is pay-as-you-go (credits). Treat base `sonar` as free-tier
            // for menu grouping only; Pro / Reasoning / Deep Research require credits.
            const looksPro = meta.tier === 'pro' || rateStr.includes('pro tier') ||
                idLower.includes('-pro') || idLower.includes('reasoning') ||
                idLower.includes('deep-research') || nameStr.includes(' pro') ||
                nameStr.includes('reasoning') || nameStr.includes('deep research');
            const isSonarBase = idLower === 'sonar' || idLower.endsWith('/sonar') ||
                (meta.tier === 'free' && !looksPro);
            if (isSonarBase && !looksPro) {
                return { paymentRequired: false, rateLimited: true, tier: 'free' };
            }
            return {
                paymentRequired: true,
                rateLimited: false,
                tier: 'pro'
            };
        }

        if (meta.tier === 'free' || rateStr.includes('free') || nameStr.includes(':free')) {
            return { paymentRequired: false, rateLimited: true, tier: 'free' };
        }
        if (meta.tier === 'pro' || rateStr.includes('$') || rateStr.includes('pro tier')) {
            return { paymentRequired: true, rateLimited: false, tier: 'pro' };
        }
        return { paymentRequired: true, rateLimited: false, tier: 'pro' };
    }

    /**
     * Normalize a provider API (or static) model into the unified catalog schema.
     * @param {string} provider
     * @param {Object} rawItem
     * @param {Object} [extras={}]
     * @returns {Object|null}
     */
    normalizeApiModel(provider, rawItem, extras = {}) {
        if (!rawItem) return null;
        let id = '';
        let displayName = '';
        let description = '';
        let contextLength = null;
        let outputTokenLimit = null;
        let pricing = null;
        let supportedMethods = null;
        let rateLimit = null;
        let resetWindow = '1m/24h';

        if (provider === 'google-ai-studio') {
            // API items use name=models/xxx; static defaults pass id=xxx and a display name
            const rawId = rawItem.id && !String(rawItem.id).includes(' ')
                ? rawItem.id
                : (rawItem.name || '');
            id = this.sanitizeModelId(rawId);
            if (!id || id.includes(' ')) {
                id = this.sanitizeModelId(rawItem.id || '');
            }
            if (!id) return null;
            displayName = rawItem.displayName ||
                String(rawItem.name || id).replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '').replace(/^[^\w]*\s*/, '').trim() ||
                id;
            // If name looked like a display label, prefer explicit id
            if (rawItem.id && /^[a-z0-9._:-]+$/i.test(rawItem.id)) {
                id = this.sanitizeModelId(rawItem.id);
                if (rawItem.displayName) displayName = rawItem.displayName;
                else if (rawItem.name && /[\s(]/.test(rawItem.name)) {
                    displayName = String(rawItem.name).replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '').replace(/^[\p{Emoji}\s]*/u, '').trim() || id;
                }
            }
            description = rawItem.description || '';
            contextLength = rawItem.inputTokenLimit || rawItem.contextLength || null;
            outputTokenLimit = rawItem.outputTokenLimit || null;
            supportedMethods = rawItem.supportedGenerationMethods || null;
            if (supportedMethods && !supportedMethods.includes('generateContent')) return null;
            const inputLimit = contextLength
                ? (contextLength >= 1000000 ? `${(contextLength / 1000000).toFixed(1)}M` : `${Math.round(contextLength / 1000)}k`)
                : null;
            const outputLimit = outputTokenLimit ? `${Math.round(outputTokenLimit / 1000)}k` : null;
            rateLimit = rawItem.rateLimit || (inputLimit ? `${inputLimit} in${outputLimit ? ` | ${outputLimit} out` : ''}` : null);
            resetWindow = rawItem.resetWindow || '1m/24h';
        } else if (provider === 'openrouter') {
            id = this.sanitizeModelId(rawItem.id || '');
            if (!id) return null;
            displayName = rawItem.name || id;
            description = rawItem.description || '';
            contextLength = rawItem.context_length || rawItem.contextLength || null;
            pricing = rawItem.pricing || null;
            const ctx = contextLength
                ? (contextLength >= 1000000 ? `${(contextLength / 1000000).toFixed(0)}M` : `${Math.round(contextLength / 1000)}k`)
                : null;
            const pPrice = pricing?.prompt ? (parseFloat(pricing.prompt) * 1000000) : 0;
            const cPrice = pricing?.completion ? (parseFloat(pricing.completion) * 1000000) : 0;
            const isFree = (pPrice === 0 && cPrice === 0) || id.endsWith(':free');
            const priceTag = isFree ? 'Free' : `$${pPrice.toFixed(2)}/M`;
            rateLimit = rawItem.rateLimit || (ctx ? `${ctx} ctx | ${priceTag}` : priceTag);
            resetWindow = isFree ? '1m/24h' : 'Realtime';
        } else {
            id = this.sanitizeModelId(rawItem.id || '');
            if (!id) return null;
            displayName = (rawItem.name || id).replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '').trim();
            description = rawItem.description || '';
            contextLength = rawItem.contextLength || null;
            outputTokenLimit = rawItem.outputTokenLimit || null;
            pricing = rawItem.pricing || null;
            rateLimit = rawItem.rateLimit || null;
            resetWindow = rawItem.resetWindow || '1m/24h';
            provider = rawItem.provider || provider;
        }

        if (modelValidator.isNonTextModality(id, { name: displayName, description }) ||
            modelCacheService.isModelFailed(id)) {
            return null;
        }

        const baseMeta = {
            ...rawItem,
            id,
            name: displayName,
            description,
            provider,
            contextLength,
            outputTokenLimit,
            pricing,
            rateLimit,
            resetWindow
        };
        const access = this.classifyAccess(id, baseMeta, pricing);
        const icon = this.getModelIcon(id, displayName);
        const category = Array.isArray(rawItem.category)
            ? rawItem.category
            : this.categorizeModel(id, displayName, description);

        let finalName = rawItem.name;
        if (!finalName || provider === 'google-ai-studio' || provider === 'openrouter') {
            if (provider === 'google-ai-studio') {
                finalName = `${icon} ${displayName} (Google AI Studio)`;
            } else if (provider === 'openrouter') {
                finalName = `${icon} ${displayName}`;
            } else {
                finalName = rawItem.name || `${icon} ${displayName}`;
            }
        }

        // Prefer static default rateLimit strings when merging known Google IDs
        const staticDefaults = { ...DEFAULT_GOOGLE_MODELS, ...DEFAULT_OPENROUTER_MODELS, ...DEFAULT_PERPLEXITY_MODELS };
        if (staticDefaults[id]?.rateLimit && extras.source === 'api' && provider === 'google-ai-studio') {
            rateLimit = staticDefaults[id].rateLimit;
        }

        return {
            name: finalName,
            category,
            icon,
            provider,
            contextLength,
            outputTokenLimit,
            rateLimit,
            resetWindow,
            description,
            pricing,
            tier: access.tier,
            paymentRequired: access.paymentRequired,
            rateLimited: access.rateLimited,
            supportedMethods,
            source: extras.source || 'static',
            fetchedAt: extras.fetchedAt || Date.now()
        };
    }

    /**
     * Enrich a static default model entry with access flags.
     * @param {string} id
     * @param {Object} meta
     * @returns {Object}
     */
    enrichStaticModel(id, meta) {
        const access = this.classifyAccess(id, { ...meta, id }, meta.pricing);
        return {
            ...meta,
            id,
            category: Array.isArray(meta.category) ? meta.category : this.categorizeModel(id, meta.name, meta.description),
            icon: meta.icon || this.getModelIcon(id, meta.name),
            tier: access.tier,
            paymentRequired: access.paymentRequired,
            rateLimited: access.rateLimited,
            source: 'static',
            fetchedAt: Date.now()
        };
    }

    categorizeModel(modelId, name = '', description = '') {
        const idLower = (modelId || '').toLowerCase();
        const text = `${modelId} ${name} ${description}`.toLowerCase();
        const categories = [];

        if (idLower.includes('imagen') || idLower.includes('flux') || idLower.includes('dall-e') ||
            (idLower.includes('image') && !idLower.includes('imagination'))) {
            categories.push('image');
        }
        if (idLower.includes('tts') || idLower.includes('text-to-speech') || idLower.includes('lyria') ||
            idLower.includes('audio-only') || (idLower.includes('speech') && !idLower.includes('speechless'))) {
            categories.push('audio');
        }
        if (idLower.includes('veo') || idLower.includes('video') || idLower.includes('sora')) {
            categories.push('video');
        }

        if (idLower.includes('antigravity') || idLower.includes('computer-use') ||
            idLower.includes('tool-use') || idLower.includes('function-calling') ||
            (idLower.includes('agent') && !idLower.includes('reagent'))) {
            categories.push('agent');
        }

        if (idLower.includes('deep-research') || idLower.includes('sonar-deep') || idLower.includes('sonar-pro') ||
            idLower.includes('sonar') || idLower.includes('search-preview') || idLower.includes('perplexity') ||
            text.includes('web search') || text.includes('grounding') || text.includes('citations') ||
            (text.includes('search') && !text.includes('semantic search'))) {
            categories.push('research');
        }

        if (idLower.includes('reasoning') || idLower.includes('thinking') || idLower.includes('thinker') ||
            idLower.includes('deepseek-reasoner') || idLower.includes('qwq') ||
            idLower.includes('-r1') || idLower.includes('/r1') || idLower.includes('-r2') ||
            idLower.includes('/o1') || idLower.includes('-o1') ||
            idLower.includes('/o3') || idLower.includes('-o3') ||
            idLower.includes('-o4') || idLower.includes('/o4') ||
            text.includes('chain-of-thought') || text.includes('step-by-step reasoning')) {
            categories.push('reasoning');
        }

        if (idLower.includes('coder') || idLower.includes('codestral') || idLower.includes('starcoder') ||
            idLower.includes('codellama') || idLower.includes('codegemma') || idLower.includes('devstral') ||
            idLower.includes('opencode') || idLower.includes('swe-') ||
            idLower.includes('wizard-coder') || idLower.includes('wizard-code') ||
            idLower.includes('deepseek-coder') || idLower.includes('qwen-coder') ||
            idLower.includes('sonnet') || idLower.includes('command-a') || idLower.includes('command-r') ||
            idLower.includes('claude') || idLower.includes('gpt') || idLower.includes('gemini') ||
            idLower.includes('gemma') || idLower.includes('flash') || idLower.includes('codex') ||
            text.includes('code generation') || text.includes('software engineering') ||
            text.includes('debugging') || text.includes('refactoring')) {
            categories.push('coding');
        }
        if (idLower.includes('flash') || idLower.includes('lite') || idLower.includes('mini') ||
            idLower.includes('nano') || idLower.includes('haiku') || idLower.includes('small') ||
            idLower.includes('fast') || text.includes('low latency')) {
            if (!categories.includes('fast')) categories.push('fast');
        }

        if (idLower.includes('gemma') || idLower.includes('llama') ||
            idLower.includes('mistral') || idLower.includes('mixtral') || idLower.includes('ministral') ||
            idLower.includes('nemo') || idLower.includes('pixtral') ||
            idLower.includes('qwen') || idLower.includes('phi') ||
            idLower.includes('falcon') || idLower.includes('olmo') || idLower.includes('aya') ||
            idLower.includes('yi-') || idLower.includes('/yi') || idLower.includes('01-ai') ||
            idLower.includes('wizard') || idLower.includes('vicuna') || idLower.includes('alpaca') ||
            idLower.includes('glm') || idLower.includes('kimi')) {
            categories.push('openweights');
        }

        if (idLower.includes('flash') || idLower.includes('-lite') || idLower.includes('/lite') ||
            idLower.includes('-mini') || idLower.includes('/mini') ||
            idLower.includes('haiku') || idLower.includes('sonar') ||
            idLower.includes('nemo') || idLower.includes('nano') || idLower.includes('turbo') ||
            idLower.includes('instant') ||
            idLower.includes('scout') || idLower.includes('-3b') || idLower.includes('-7b') ||
            text.includes('low latency') || text.includes('lightweight') || text.includes('fast inference')) {
            categories.push('fast');
        }

        if (idLower.includes('gpt-4') || idLower.includes('gpt-3') || idLower.includes('chatgpt') ||
            idLower.includes('learnlm') || idLower.includes('maverick') ||
            idLower.includes('kimi') || idLower.includes('minimax') ||
            idLower.includes('glm') || idLower.includes('baichuan')) {
            if (!categories.includes('general')) categories.push('general');
        }

        if (categories.length === 0) {
            categories.push('general');
        }
        return categories;
    }

    /** Chat-selectable category IDs (excludes image/audio/video). */
    getChatCategoryIds() {
        return ['coding', 'reasoning', 'research', 'agent', 'openweights', 'fast', 'general'];
    }

    /**
     * Determine dynamic icon emoji based on model vendor, family, or category.
     * @param {string} [modelId=''] - Model ID string
     * @param {string} [name=''] - Model display name
     * @returns {string} Icon emoji string
     */
    getModelIcon(modelId = '', name = '') {
        const text = `${modelId} ${name}`.toLowerCase();

        // 1. Specialized Capabilities & Sub-brands
        if (text.includes('nano-banana') || text.includes('imagen') || text.includes('image') || text.includes('flux') || text.includes('dall-e')) return '🎨';
        if (text.includes('tts') || text.includes('speech') || text.includes('audio') || text.includes('lyria')) return '🎙️';
        if (text.includes('veo') || text.includes('video') || text.includes('sora')) return '🎬';
        if (text.includes('custom tools') || text.includes('tools') || text.includes('function-calling')) return '🛠️';
        if (text.includes('antigravity') || text.includes('computer-use') || text.includes('agent')) return '🤖';
        if (text.includes('deep-research') || text.includes('research') || text.includes('search')) return '🔍';
        if (text.includes('coder') || text.includes('starcoder') || text.includes('codestral')) return '💻';
        if (text.includes('deepseek')) return '🧬';
        if (text.includes('reasoning') || text.includes('r1') || text.includes('o1') || text.includes('o3') || text.includes('thinker')) return '🔬';

        // 2. Specific Sub-Models & Vendors
        if (text.includes('grok') || text.includes('xai') || text.includes('x-ai')) return '🚀';
        if (text.includes('poolside') || text.includes('laguna')) return '🌊';
        if (text.includes('ling')) return '⚡';
        if (text.includes('claude') || text.includes('anthropic')) return '🎭';
        if (text.includes('gpt') || text.includes('openai') || text.includes('codex') || text.includes('chatgpt')) return '⚡';
        if (text.includes('gemma') || text.includes('llama') || text.includes('meta')) return '🦙';
        if (text.includes('deepseek')) return '🧬';
        if (text.includes('mistral') || text.includes('mixtral') || text.includes('ministral') || text.includes('pixtral') || text.includes('voxtral')) return '🌪️';
        if (text.includes('sonar') || text.includes('perplexity')) return '🎯';
        if (text.includes('nova') || text.includes('amazon') || text.includes('bedrock')) return '📦';
        if (text.includes('nvidia') || text.includes('nemotron')) return '🎮';
        if (text.includes('qwen') || text.includes('alibaba')) return '🐉';
        if (text.includes('cohere') || text.includes('command') || text.includes('north')) return '⚔️';
        if (text.includes('kimi') || text.includes('moonshot')) return '🌙';
        if (text.includes('minimax')) return '🌌';
        if (text.includes('glm') || text.includes('z.ai') || text.includes('z-ai') || text.includes('zhipu')) return '🔮';
        if (text.includes('baichuan')) return '🌊';
        if (text.includes('yi') || text.includes('01-ai')) return '💡';
        if (text.includes('stepfun') || text.includes('step-')) return '🐾';
        if (text.includes('olmo') || text.includes('allenai')) return '🧠';

        // 3. Gemini / Google Specific Model Sub-Types
        if (text.includes('gemini') || text.includes('google')) {
            if (text.includes('pro')) return '💎';
            if (text.includes('ultra')) return '👑';
            if (text.includes('flash-lite') || text.includes('lite')) return '⚡';
            if (text.includes('flash')) return '⚡';
            return '✨';
        }

        return '🤖';
    }

    /**
     * Dynamically fetch available models from Google AI Studio API.
     * @param {string|null} [apiKey=null] - Optional Google API Key
     * @returns {Promise<Object>} Dictionary of Google models metadata
     */
    async fetchGoogleModels(apiKey = null) {
        const key = apiKey || (this.config && typeof this.config.getGoogleApiKey === 'function' ? this.config.getGoogleApiKey() : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
        const fallback = {};
        for (const [id, meta] of Object.entries(DEFAULT_GOOGLE_MODELS)) {
            const enriched = this.enrichStaticModel(id, meta);
            enriched.source = 'emergency-static';
            fallback[id] = enriched;
        }
        if (!key) return fallback;

        try {
            logger.info('ModelManager: Fetching dynamic models from Google AI Studio API...');
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            const response = await axios.get(endpoint, { timeout: 8000 });
            if (response.data && Array.isArray(response.data.models)) {
                const dynamicGoogleModels = {};
                const fetchedAt = Date.now();
                for (const item of response.data.models) {
                    if (!item.name) continue;
                    const normalized = this.normalizeApiModel('google-ai-studio', item, { source: 'api', fetchedAt });
                    if (!normalized) continue;
                    const modelId = this.sanitizeModelId(item.name);
                    dynamicGoogleModels[modelId] = normalized;
                }
                if (Object.keys(dynamicGoogleModels).length > 0) {
                    return dynamicGoogleModels;
                }
            }
        } catch (error) {
            logger.error(`ModelManager: Failed to fetch Google AI Studio models: ${error.message}`);
        }
        return fallback;
    }

    /**
     * Fetch all available LLM models from Google AI Studio API, OpenRouter API & Perplexity defaults.
     * On successful provider fetch, that provider's slice is replaced (no ghost static IDs).
     * @param {Object} [options={}] - Options (bypassCache: boolean)
     * @returns {Promise<Object>} Dictionary of model metadata objects indexed by ID
     */
    async fetchModels(options = {}) {
        const cacheFile = path.join(os.homedir(), '.lorapok', 'models_cache.json');

        if (options.bypassCache) {
            this.cache.del('allModels');
            try {
                if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
            } catch (err) {
                logger.warn(`ModelManager: Failed to clear models_cache.json - ${err.message}`);
            }
        }

        if (!options.bypassCache) {
            const cached = this.cache.get('allModels');
            if (cached) return cached;

            try {
                if (fs.existsSync(cacheFile)) {
                    const stats = fs.statSync(cacheFile);
                    if (Date.now() - stats.mtimeMs < 86400000) {
                        const fileCached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                        this.cache.set('allModels', fileCached);
                        return fileCached;
                    }
                }
            } catch (err) {
                logger.warn(`ModelManager: Failed to read models_cache.json - ${err.message}`);
            }
        }

        const fetchedAt = Date.now();

        // Perplexity: no public list API — seed as unverified candidates (must pass probe to select).
        const perplexityModels = {};
        for (const [id, meta] of Object.entries(DEFAULT_PERPLEXITY_MODELS)) {
            const enriched = this.enrichStaticModel(id, meta);
            enriched.source = 'seed';
            enriched.accessState = 'unverified';
            perplexityModels[id] = enriched;
        }

        const googleModels = await this.fetchGoogleModels();

        let openRouterOk = false;
        const openRouterModels = {};
        try {
            logger.info('ModelManager: Fetching dynamic models from OpenRouter API...');
            const response = await axios.get(this.openrouterEndpoint, { timeout: 8000 });
            if (response.data && Array.isArray(response.data.data)) {
                for (const item of response.data.data) {
                    if (!item.id) continue;
                    const normalized = this.normalizeApiModel('openrouter', item, { source: 'api', fetchedAt });
                    if (!normalized) continue;
                    openRouterModels[this.sanitizeModelId(item.id)] = normalized;
                }
                openRouterOk = Object.keys(openRouterModels).length > 0;
            }
        } catch (error) {
            logger.error(`ModelManager: Failed to fetch OpenRouter models: ${error.message}`);
        }

        // Offline emergency only — never mixed into a successful OpenRouter fetch.
        if (!openRouterOk) {
            logger.warn('ModelManager: OpenRouter API unavailable — using emergency static stubs');
            for (const [id, meta] of Object.entries(DEFAULT_OPENROUTER_MODELS)) {
                const enriched = this.enrichStaticModel(id, meta);
                enriched.source = 'emergency-static';
                openRouterModels[id] = enriched;
            }
        }

        const models = { ...perplexityModels, ...openRouterModels, ...googleModels };

        this.cache.set('allModels', models);

        try {
            const lorapokDir = path.join(os.homedir(), '.lorapok');
            if (!fs.existsSync(lorapokDir)) fs.mkdirSync(lorapokDir, { recursive: true });
            fs.writeFileSync(cacheFile, JSON.stringify(models, null, 2), 'utf8');
        } catch (err) {
            logger.warn(`ModelManager: Failed to write models_cache.json - ${err.message}`);
        }

        return models;
    }


    /**
     * Model Validator Middleware: Filter and return only usable, active models with valid provider keys.
     * @param {Object} models - Dictionary of model objects
     * @param {Object} keys - API keys object { googleKey, openRouterKey, perplexityKey }
     * @returns {Object} Dictionary of only validated usable models
     */
    validateUsableModels(models = {}, keys = {}) {
        return modelValidator.validateUsableModels(models, keys);
    }

    /**
     * Retrieve models grouped by expertise categories.
     * @param {Object} [options={}] - Filter options
     * @returns {Promise<Object>} Object mapping category IDs to arrays of model objects
     */
    async getModelsByCategory(options = {}) {
        const allModels = await this.fetchModels(options);
        const grouped = {
            coding: [],
            reasoning: [],
            research: [],
            fast: [],
            general: []
        };

        for (const [id, meta] of Object.entries(allModels)) {
            let cats = meta.category || ['general'];
            if (!Array.isArray(cats)) cats = [cats];
            
            for (const cat of cats) {
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push({ id, ...meta });
            }
        }

        return grouped;
    }

    /**
     * Get curated top recommended models for each expertise domain.
     * @returns {Object} Object mapping domain names to lists of recommended models
     */
    getRecommendedModels() {
        return {
            coding: [
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', reason: 'Best-in-class code generation, refactoring, and architecture.' },
                { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', reason: 'State-of-the-art open reasoning with transparent chain-of-thought.' },
                { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'openrouter', reason: 'Specialized open-weights coding model, excellent at completions.' }
            ],
            reasoning: [
                { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'google-ai-studio', reason: 'Fast thinking-capable model with 1M context. Free API.' },
                { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', reason: 'Deep algorithmic reasoning with full chain-of-thought visibility.' },
                { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', provider: 'perplexity', reason: 'Chain-of-thought reasoning combined with live web search.' }
            ],
            research: [
                { id: 'sonar-deep-research', name: 'Sonar Deep Research', provider: 'perplexity', reason: 'Exhaustive multi-source research report generation.' },
                { id: 'sonar-pro', name: 'Sonar Pro', provider: 'perplexity', reason: 'Fast grounded web search with inline citations.' },
                { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'google-ai-studio', reason: 'Native multimodal Flash alias with long context.' }
            ],
            fast: [
                { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'google-ai-studio', reason: 'Rolling latest Flash alias. Free API. 1M context.' },
                { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'google-ai-studio', reason: 'Current-generation fast multimodal chat model.' },
                { id: 'sonar', name: 'Sonar', provider: 'perplexity', reason: 'Lightweight web-grounded model for quick lookups.' }
            ]
        };
    }

    /**
     * Return expertise categories definitions.
     * @returns {Object} CATEGORIES metadata object
     */
    getCategories() {
        return CATEGORIES;
    }
    /**
     * Get all statically known models combined from defaults.
     * @returns {Object} Dictionary of all known models
     */
    getAllKnownModels() {
        return { ...DEFAULT_PERPLEXITY_MODELS, ...DEFAULT_OPENROUTER_MODELS, ...DEFAULT_GOOGLE_MODELS };
    }

    /**
     * True when the model does not require paid credits (compat wrapper).
     * @param {Object} m - Model metadata object
     * @returns {boolean}
     */
    isFreeTier(m) {
        if (!m) return false;
        if (typeof m.paymentRequired === 'boolean') return !m.paymentRequired;
        const access = this.classifyAccess(m.id || '', m, m.pricing);
        return !access.paymentRequired;
    }

    /**
     * Usable menu IDs: available + not payment-required + not failed.
     * @param {Object} validated - validateUsableModels output
     * @returns {string[]}
     */
    getUsableModelIds(validated = {}) {
        return Object.keys(validated).filter(id => {
            const m = validated[id];
            if (!m || m.available !== true) return false;
            if (modelCacheService.isModelFailed(id)) return false;
            if (modelValidator.isNonTextModality(id, m)) return false;
            if (!this.isFreeTier({ ...m, id })) return false;
            const access = m.accessState || modelAccessService.getAccessState(id);
            // Only live-probed free models (accessible / rate_limited) — never unverified/error/locked.
            return access === 'accessible' || access === 'rate_limited';
        });
    }

    /**
     * Paid catalog IDs: payment-required chat models (not failed / not modality).
     * @param {Object} validated
     * @returns {string[]}
     */
    getPaidCatalogIds(validated = {}) {
        return Object.keys(validated).filter(id => {
            const m = validated[id];
            if (!m) return false;
            if (modelCacheService.isModelFailed(id)) return false;
            if (modelValidator.isNonTextModality(id, m)) return false;
            return !this.isFreeTier({ ...m, id });
        });
    }

    /**
     * Catalog models tagged with category (accessible + locked), not usable-only.
     * Prefer chat-compatible text models; empty only when none are tagged.
     */
    getModelsByCategoryView(validated, category) {
        const ids = Object.keys(validated || {});
        return ids.filter(id => {
            const meta = validated[id] || {};
            if (meta.modality && meta.modality !== 'text' && meta.modality !== 'chat') return false;
            const cats = Array.isArray(meta.category)
                ? meta.category
                : this.categorizeModel(id, meta.name || '', meta.description || '');
            return cats.includes(category);
        });
    }

    /**
     * Category browse for Currently Usable set (free-tier + live-accessible only).
     * @param {Object} validated
     * @param {string} category
     * @returns {string[]}
     */
    getUsableModelsByCategoryView(validated, category) {
        const usable = new Set(this.getUsableModelIds(validated));
        return this.getModelsByCategoryView(validated, category).filter(id => usable.has(id));
    }

    /**
     * Models for a provider when the user has that provider's key.
     * Includes free + paid (unlike Currently Usable, which is free-tier only).
     * @param {Object} validated
     * @param {string} provider
     * @returns {string[]}
     */
    getModelsByProviderView(validated, provider) {
        return Object.keys(validated || {}).filter(id => {
            const m = validated[id];
            if (!m || m.provider !== provider) return false;
            if (modelCacheService.isModelFailed(id)) return false;
            if (modelValidator.isNonTextModality(id, m)) return false;
            // Key presence is encoded as available === true by ModelValidator
            return m.available === true;
        });
    }

    /**
     * Providers that have at least one keyed (available) model.
     * @param {Object} validated
     * @returns {string[]}
     */
    getKeyedProviders(validated = {}) {
        const set = new Set();
        for (const id of Object.keys(validated || {})) {
            const m = validated[id];
            if (!m || m.available !== true) continue;
            if (modelCacheService.isModelFailed(id)) continue;
            if (modelValidator.isNonTextModality(id, m)) continue;
            if (m.provider) set.add(m.provider);
        }
        return [...set];
    }

    /**
     * Single legend for /help, menus, and Docs — keep icons/colors in sync.
     * color: chalk color name used by CLI renderers.
     */
    static getTierLegend() {
        return [
            { icon: '🟢', color: 'green', title: 'Free Tier', detail: 'No payment; normal free-API / free-tier limits (Google Flash, Sonar, etc.).' },
            { icon: '🔵', color: 'cyan', title: 'Free API — lower RPM', detail: 'Google Pro/Ultra on a free AI Studio key — usable, tighter RPM/TPM.' },
            { icon: '🟣', color: 'magenta', title: 'Free Tier — daily limits', detail: 'OpenRouter :free models — usable with daily/reset windows.' },
            { icon: '🔴', color: 'red', title: 'Hit rate limit', detail: 'Live probe got HTTP 429 — still listed; retry after quota resets or pick another model.' },
            { icon: '✅', color: 'yellow', title: 'Pro — Accessible', detail: 'Payment-tier model your key can call (credits may still apply).' },
            { icon: '⚪', color: 'gray', title: 'Pro — Unverified', detail: 'Keyed but not live-probed yet — run /refresh-models.' },
            { icon: '💳', color: 'yellow', title: 'Pro — Credits / Locked', detail: 'Paid catalog entry needing credits or provider unlock.' },
            { icon: '🔒', color: 'gray', title: 'No Key', detail: 'Add the provider API key in /settings to unlock.' }
        ];
    }

    getTierLabel(item, hasAccess, showCatalog) {
        const access = item.accessState || modelAccessService.getAccessState(item.id);
        if (access === 'locked' || (showCatalog && !hasAccess)) {
            if (!hasAccess) return '(No Key — Add to Unlock)';
            return '(Pro — Credits Required / Locked)';
        }
        const idName = `${item.id || ''} ${item.name || ''}`.toLowerCase();
        const googleLowerRpm = item.provider === 'google-ai-studio' &&
            (item.rateLimited || idName.includes('pro') || idName.includes('ultra'));

        // Live probe received HTTP 429 — still selectable, but quota is hot right now
        if (access === 'rate_limited') {
            return '(Hit rate limit — retry later)';
        }

        if (this.isFreeTier(item)) {
            if (googleLowerRpm) return '(Free API — lower RPM)';
            if (item.provider === 'openrouter') return '(Free Tier — daily limits)';
            return '(Free Tier)';
        }
        if (access === 'accessible') return '(Pro — Accessible)';
        if (access === 'unverified') return '(Pro — Unverified)';
        return '(Pro — Credits Required / Locked)';
    }

    getStatusIcon(item, hasAccess, showCatalog) {
        const access = item.accessState || modelAccessService.getAccessState(item.id);
        if (access === 'locked' || (showCatalog && !hasAccess)) return '🔒';
        const idName = `${item.id || ''} ${item.name || ''}`.toLowerCase();
        const googleLowerRpm = item.provider === 'google-ai-studio' &&
            (item.rateLimited || idName.includes('pro') || idName.includes('ultra'));

        if (access === 'rate_limited') return '🔴';
        if (this.isFreeTier(item)) {
            if (googleLowerRpm) return '🔵';
            if (item.provider === 'openrouter') return '🟣';
            return '🟢';
        }
        if (access === 'accessible') return '✅';
        if (access === 'unverified') return '⚪';
        return '💳';
    }

    /**
     * Icon + chalk color + label for one model row (menus / help stay consistent).
     * @returns {{ icon: string, color: string, label: string }}
     */
    getTierStyle(item, hasAccess, showCatalog) {
        const label = this.getTierLabel(item, hasAccess, showCatalog);
        const icon = this.getStatusIcon(item, hasAccess, showCatalog);
        let color = 'yellow';
        if (label.includes('No Key') || label.includes('Unverified')) color = 'gray';
        else if (label.includes('Hit rate limit')) color = 'red';
        else if (label.includes('lower RPM')) color = 'cyan';
        else if (label.includes('daily limits')) color = 'magenta';
        else if (label.includes('Free Tier')) color = 'green';
        else if (label.includes('Accessible')) color = 'yellow';
        else if (label.includes('Credits') || label.includes('Locked')) color = 'yellow';
        return { icon, color, label };
    }

    /**
     * Score-based fallback ranking over current usable/selectable set.
     * @param {Object} validated
     * @param {string|null} failedModelId
     * @returns {string[]}
     */
    buildFallbackRank(validated = {}, failedModelId = null) {
        const failed = this.sanitizeModelId(failedModelId || '');
        const failedMeta = validated[failed] || {};
        const failedProvider = failedMeta.provider || this.getProviderForModel(failed);
        const failedCats = Array.isArray(failedMeta.category) ? failedMeta.category : [failedMeta.category].filter(Boolean);

        const candidates = Object.keys(validated).filter(id => {
            if (id === failed) return false;
            if (modelCacheService.isModelFailed(id)) return false;
            if (!this.canSelectModel(id, validated) && !this.getUsableModelIds(validated).includes(id)) {
                // Allow usable unverified free as soft candidates
                const m = validated[id];
                if (!m || m.available !== true || !this.isFreeTier({ ...m, id })) return false;
                const access = m.accessState || modelAccessService.getAccessState(id);
                if (access === 'unavailable' || access === 'locked') return false;
            }
            return true;
        });

        // Prefer strictly selectable; include other usable as lower tier
        const scored = candidates.map(id => {
            const m = validated[id] || {};
            const access = m.accessState || modelAccessService.getAccessState(id);
            let score = 0;
            if (m.provider === failedProvider) score += 50;
            if (access === 'accessible') score += 40;
            if (access === 'rate_limited') score += 20;
            if (access === 'unverified') score += 5;
            if (this.isFreeTier({ ...m, id })) score += 25;
            const cats = Array.isArray(m.category) ? m.category : [m.category];
            if (failedCats.some(c => cats.includes(c))) score += 15;
            const ctx = Number(m.contextLength) || 0;
            score += Math.min(10, Math.log10(ctx + 1));
            if (modelCacheService.isModelFailed(id)) score -= 100;
            if (access === 'rate_limited') score -= 5;
            return { id, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.id);
    }

    /**
     * Pick a fallback model ID from scored rank (no hard-coded dead IDs).
     * @param {Object} validated
     * @param {string} failedModelId
     * @returns {string|null}
     */
    pickFallbackModelId(validated, failedModelId) {
        const rank = this.buildFallbackRank(validated, failedModelId);
        return rank[0] || null;
    }

    /**
     * Whether a model ID may be selected for active use (live-accessible).
     * @param {string} modelId
     * @param {Object} validated
     * @returns {boolean}
     */
    canSelectModel(modelId, validated = {}) {
        const id = this.sanitizeModelId(modelId);
        const m = validated[id];
        if (!m || m.available !== true) return false;
        if (modelCacheService.isModelFailed(id)) return false;
        if (modelValidator.isNonTextModality(id, m)) return false;
        const access = m.accessState || modelAccessService.getAccessState(id);
        // Must be live-probed accessible or rate_limited (never unverified/error/locked).
        return modelAccessService.isSelectableState(access);
    }

    /**
     * Sort model IDs for menus: accessible Google/fast first, then rate_limited, then others.
     * @param {string[]} ids
     * @param {Object} validated
     * @returns {string[]}
     */
    sortModelIdsForDisplay(ids = [], validated = {}) {
        const rankAccess = (a) => {
            if (a === 'accessible') return 0;
            if (a === 'rate_limited') return 1;
            return 2;
        };
        const rankProvider = (p) => {
            if (p === 'google-ai-studio') return 0;
            if (p === 'perplexity') return 1;
            return 2;
        };
        return [...ids].sort((a, b) => {
            const ma = validated[a] || {};
            const mb = validated[b] || {};
            const aa = ma.accessState || modelAccessService.getAccessState(a);
            const ab = mb.accessState || modelAccessService.getAccessState(b);
            const dAccess = rankAccess(aa) - rankAccess(ab);
            if (dAccess) return dAccess;
            const dProv = rankProvider(ma.provider) - rankProvider(mb.provider);
            if (dProv) return dProv;
            return a.localeCompare(b);
        });
    }

    /**
     * Lightweight metadata lookup from cache/defaults.
     * @param {string} modelId
     * @returns {Object}
     */
    getModelMetadata(modelId) {
        const id = this.sanitizeModelId(modelId);
        const cached = this.cache.get('allModels');
        if (cached && cached[id]) return { id, ...cached[id] };
        const known = this.getAllKnownModels()[id];
        if (known) return { id, ...known };
        return { id, name: id, provider: this.getProviderForModel(id) };
    }

    /**
     * Infer the provider for a given model ID based on string prefix matching and known models.
     * @param {string} modelId - Model ID string
     * @returns {'openrouter'|'perplexity'|'google-ai-studio'} Provider string
     */
    getProviderForModel(modelId) {
        if (!modelId) return 'perplexity';
        const all = this.getAllKnownModels();
        if (all[modelId]?.provider) return all[modelId].provider;
        
        // Also check cached available models if we already fetched them
        const cached = this.cache.get('allModels');
        if (cached && cached[modelId]?.provider) return cached[modelId].provider;

        // Google AI Studio — all Gemini/Gemma/LearnLM/experimental models
        if (
            modelId.startsWith('gemini-') || 
            modelId.startsWith('models/gemini-') || 
            modelId.startsWith('google-ai-studio/') ||
            modelId.startsWith('gemma-') ||
            modelId.startsWith('gemma2-') ||
            modelId.startsWith('gemma3-') ||
            modelId.startsWith('learnlm-') ||
            modelId.startsWith('antigravity-') ||
            modelId.startsWith('deep-research-')
        ) {
            return 'google-ai-studio';
        }
        // OpenRouter — all provider/model namespaced IDs
        if (
            modelId.startsWith('openrouter/') ||
            modelId.startsWith('anthropic/') ||
            modelId.startsWith('openai/') ||
            modelId.startsWith('deepseek/') ||
            modelId.startsWith('meta-llama/') ||
            modelId.startsWith('google/') ||
            modelId.startsWith('mistralai/') ||
            modelId.startsWith('qwen/') ||
            modelId.startsWith('x-ai/') ||
            modelId.startsWith('moonshotai/') ||
            modelId.startsWith('cohere/') ||
            modelId.startsWith('nvidia/') ||
            modelId.startsWith('amazon/') ||
            modelId.startsWith('01-ai/') ||
            modelId.startsWith('z-ai/') ||
            modelId.startsWith('minimax/')
        ) {
            return 'openrouter';
        }
        return 'perplexity';
    }
}

module.exports = { ModelManager, CATEGORIES, DEFAULT_PERPLEXITY_MODELS, DEFAULT_OPENROUTER_MODELS, DEFAULT_GOOGLE_MODELS };

