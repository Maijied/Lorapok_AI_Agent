# Code Style & Quality Standards

## Syntax & Standard Conventions
- **Module System**: CommonJS (`const ... = require(...)`, `module.exports = ...`).
- **Target Runtime**: Node.js v18.0.0+ LTS.
- **Asynchronous Code**: Use `async`/`await` over raw promises and callbacks. Wrap async operations in standard try/catch blocks with custom `LorapokError` subclasses.

## Custom Error Classes (`lib/errors.js`)
- `LorapokError`: Base error class for all agent domain errors.
- `GitError`: Throw when `git` execution fails or repository operations are invalid.
- `ConfigError`: Throw when configuration keys, `.env` variables, or settings are malformed.
- `AuthError`: Throw when GitHub OAuth or API keys fail authentication.

## Logging Strategy (`lib/logger.js`)
- Use the Winston logger instance: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`.
- Logs are written to standard Winston transport targets and `.lorapok.log` files.
- Keep interactive terminal printing separate in `lib/ui.js` and `lib/renderer.js`.

## LLM API Routing & Fallbacks
- **Validation**: Rely on `ModelManager` and `ModelValidator` to verify model status before invocation.
- **Failover Logic**: If a model request yields a 429 Rate Limit or 404 error, gracefully failover to a validated fallback model (e.g., `gemini-2.0-flash`) instead of throwing an unhandled exception. Register the failure with `ModelCacheService.addFailedModel`.
