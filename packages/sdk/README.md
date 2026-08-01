# @lorapok/sdk

Thin HTTP client for the Lorapok Express REST API. Use this package from `apps/website`, future Android/iOS bridges, and desktop shells.

## Install (workspace)

```bash
# from repo root — private package
node -e "console.log(require('./packages/sdk').createLorapokClient)"
```

## Quick start

```js
const { createLorapokClient } = require('@lorapok/sdk');
// or: require('../../packages/sdk/src')

const client = createLorapokClient('http://localhost:3847');

await client.health();
const { models } = await client.getModels('usable');
await client.chat('Hello', { model: 'gemini-2.5-flash' });
```

## Contract

See [Docs/api/REST.md](../../Docs/api/REST.md) and [Docs/api/MODELS.md](../../Docs/api/MODELS.md).
