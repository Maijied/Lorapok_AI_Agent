---
name: lorapok-mcp-integration
description: Skill for building, configuring, and verifying Model Context Protocol (MCP) server & client integrations within Lorapok AI Agent.
---

# Lorapok MCP Integration Skill

## Overview
Model Context Protocol (MCP) allows Lorapok AI Agent to expose and consume external tools, resources, and prompt templates standardizing agent capabilities.

## Architecture & Config
- Project MCP config file: `mcp.json` / `.agents/mcp.json` (keep identical).
- **Enabled servers today:** `filesystem`, `git` only.
- Do not document command-execution or search servers as active unless added to `mcp.json`.

## Standards
- Tool names must be lower_snake_case.
- Parameters must include JSON schema descriptions.
- Secure tool invocation with permission validation and argument sanitization.
