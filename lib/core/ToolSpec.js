/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * ToolSpec — canonical tool definition used by the orchestrator, adapters, and policy engine.
 */
'use strict';

const { ValidationError } = require('../errors');

// ── Policy Tiers ─────────────────────────────────────────────────────

/**
 * Policy tier enum controlling how a tool call is approved.
 * @enum {string}
 */
const POLICY_TIERS = {
    /** Always allowed, no prompt (read-only operations) */
    ALWAYS_ALLOW: 'always_allow',
    /** Allowed if command is on the per-repo allowlist */
    ALLOWLIST: 'allowlist',
    /** Always requires explicit user confirmation */
    CONFIRM: 'confirm',
    /** Hard-denied, never executable */
    DENY: 'deny'
};

const VALID_POLICY_TIERS = new Set(Object.values(POLICY_TIERS));

// ── ToolSpec Class ───────────────────────────────────────────────────

/**
 * Canonical tool definition used across the system.
 * Each tool in the ToolRuntime registers one of these.
 */
class ToolSpec {
    /**
     * @param {Object} options - Tool specification options
     * @param {string} options.name - Unique tool name (e.g., 'read_file', 'run_command')
     * @param {string} options.description - Human-readable description of what the tool does
     * @param {Object} options.inputSchema - JSON Schema object describing the tool's input parameters
     * @param {string} [options.policyTier='confirm'] - Policy tier from POLICY_TIERS
     * @param {boolean} [options.requiresNetwork=false] - Whether the tool needs network access
     * @param {boolean} [options.mutatesState=false] - Whether the tool modifies repo/file state
     */
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new ValidationError('ToolSpec requires an options object', 'options');
        }
        if (!options.name || typeof options.name !== 'string') {
            throw new ValidationError('ToolSpec requires a non-empty string name', 'name');
        }
        if (!options.description || typeof options.description !== 'string') {
            throw new ValidationError('ToolSpec requires a non-empty string description', 'description');
        }
        if (!options.inputSchema || typeof options.inputSchema !== 'object') {
            throw new ValidationError('ToolSpec requires an inputSchema object', 'inputSchema');
        }

        const tier = options.policyTier || POLICY_TIERS.CONFIRM;
        if (!VALID_POLICY_TIERS.has(tier)) {
            throw new ValidationError(
                `Invalid policyTier: "${tier}". Must be one of: ${[...VALID_POLICY_TIERS].join(', ')}`,
                'policyTier'
            );
        }

        this.name = options.name;
        this.description = options.description;
        this.inputSchema = options.inputSchema;
        this.policyTier = tier;
        this.requiresNetwork = Boolean(options.requiresNetwork);
        this.mutatesState = Boolean(options.mutatesState);
    }

    /**
     * Validate an input object against this tool's inputSchema.
     * Performs basic type and required-field checks (not full JSON Schema validation).
     * @param {Object} input - Input to validate
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateInput(input) {
        const errors = [];
        if (!input || typeof input !== 'object') {
            return { valid: false, errors: ['Input must be a non-null object'] };
        }

        const schema = this.inputSchema;
        if (schema.type === 'object' && schema.properties) {
            const required = Array.isArray(schema.required) ? schema.required : [];
            for (const field of required) {
                if (!(field in input) || input[field] === undefined || input[field] === null) {
                    errors.push(`Missing required field: "${field}"`);
                }
            }
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in input && input[key] !== undefined && input[key] !== null) {
                    const expectedType = propSchema.type;
                    if (expectedType) {
                        const actualType = Array.isArray(input[key]) ? 'array' : typeof input[key];
                        if (actualType !== expectedType) {
                            errors.push(`Field "${key}" expected type "${expectedType}", got "${actualType}"`);
                        }
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Serialize to a plain JSON-safe object (for provider adapter translation).
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            inputSchema: this.inputSchema,
            policyTier: this.policyTier,
            requiresNetwork: this.requiresNetwork,
            mutatesState: this.mutatesState
        };
    }

    /**
     * Create a ToolSpec from a plain object.
     * @param {Object} obj - Plain object
     * @returns {ToolSpec}
     */
    static fromJSON(obj) {
        return new ToolSpec(obj);
    }

    /**
     * Convert inputSchema to a provider-compatible function schema.
     * Strips unsupported fields per provider requirements.
     * @param {string} [provider='openai'] - Target provider format
     * @returns {Object} Provider-compatible schema
     */
    toProviderSchema(provider = 'openai') {
        const base = {
            name: this.name,
            description: this.description,
            parameters: this.inputSchema
        };

        switch (provider) {
            case 'google':
            case 'gemini':
                // Google uses a slightly different schema shape
                return {
                    name: this.name,
                    description: this.description,
                    parameters: stripUnsupportedFields(this.inputSchema, ['default', '$ref', 'examples'])
                };
            case 'openai':
            case 'openrouter':
            default:
                return base;
        }
    }
}

/**
 * Strip unsupported fields from a JSON schema recursively.
 * @param {Object} schema - JSON Schema object
 * @param {string[]} fieldsToRemove - Field names to strip
 * @returns {Object} Cleaned schema
 */
function stripUnsupportedFields(schema, fieldsToRemove) {
    if (!schema || typeof schema !== 'object') return schema;
    const result = {};
    for (const [key, value] of Object.entries(schema)) {
        if (fieldsToRemove.includes(key)) continue;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = stripUnsupportedFields(value, fieldsToRemove);
        } else {
            result[key] = value;
        }
    }
    return result;
}

module.exports = {
    ToolSpec,
    POLICY_TIERS,
    VALID_POLICY_TIERS,
    stripUnsupportedFields
};
