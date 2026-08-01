# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.6.0...v1.7.0) (2026-08-01)


### Features

* **website:** add splash and lighting animations to marketing banner ([93a2427](https://github.com/Maijied/Lorapok_AI_Agent/commit/93a24275eb6e893ad92a64d15366d36a0d579f24))


### Bug Fixes

* **website:** add missing LorapokOrginalcLI.png to public/assets to fix broken image ([ce9f744](https://github.com/Maijied/Lorapok_AI_Agent/commit/ce9f7449d5554e13d590b17d6a9153c30722b09d))

## [1.6.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.5.0...v1.6.0) (2026-08-01)


### Features

* Implement 'Suggested Next Questions' flow in Chat Mode ([808f2e4](https://github.com/Maijied/Lorapok_AI_Agent/commit/808f2e4fd0d4b73ff8a4a85c7abee40d11490fd4))
* Implement multi-provider architecture and operational modes ([8f13d32](https://github.com/Maijied/Lorapok_AI_Agent/commit/8f13d3227d0ea048e18583ff4f73a096a34a1114))
* **ui:** implement smart code diff chunking and output folding ([7d22e8b](https://github.com/Maijied/Lorapok_AI_Agent/commit/7d22e8b937dc45cd43a1495d117b68fa907644df))


### Bug Fixes

* **cli:** enhance plan mode autonomy and UI separator ([6c6c9a8](https://github.com/Maijied/Lorapok_AI_Agent/commit/6c6c9a8cf8565ea2d3fd57891e1bbb0029dd6b67))
* Implement autonomous feedback loop for actions in Plan Mode ([3cd2f35](https://github.com/Maijied/Lorapok_AI_Agent/commit/3cd2f35b28c5b12c11795f925d0dee6edb903fe3))
* prevent smart commit prompt on pure shell commands in chat mode ([6d7f255](https://github.com/Maijied/Lorapok_AI_Agent/commit/6d7f25554347e218898d96e298be51d7a8e42eda))
* refine autonomous mode conversational output and separator lines ([d82f2ba](https://github.com/Maijied/Lorapok_AI_Agent/commit/d82f2ba891eebe0c7205b81b0c8f580907664c12))
* resolve unknown command warning when entering agent or debug mode ([46d68c4](https://github.com/Maijied/Lorapok_AI_Agent/commit/46d68c49d53f58b4e463d593964a8f07c7292053))
* strip &lt;suggestions&gt; tags from plan output UI ([16fad6e](https://github.com/Maijied/Lorapok_AI_Agent/commit/16fad6e6b4768d4bc9e9dc608b51827f033cae79))

## [1.5.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.4.0...v1.5.0) (2026-08-01)


### Features

* **cli:** add animated bye-bye larva beside SESSION RECAP metrics ([99627e5](https://github.com/Maijied/Lorapok_AI_Agent/commit/99627e526e3af343eb6b4a87cb318d8cb5d1701c))
* **cli:** polish model status colors, response frame, exit recap, and header alignment ([0c1a7d0](https://github.com/Maijied/Lorapok_AI_Agent/commit/0c1a7d08b6d06261e916e7912bf91257af6e99c2))
* live model sanitize, menu views, and architecture docs ([eeb80b3](https://github.com/Maijied/Lorapok_AI_Agent/commit/eeb80b3d3ef29b5b5421f0b4bdbc676151a55432))
* **core:** implement multi-provider coding CLI architecture (Orchestrator, ModeRouter, Adapters, SessionManager, PolicyEngine, CheckpointManager) with 16 new test suites (570 tests passing)


### Bug Fixes

* **cli:** center bye-bye logo in SESSION RECAP metrics gap ([650ca0a](https://github.com/Maijied/Lorapok_AI_Agent/commit/650ca0a1e3a6ba0174ec439722ca298c8eb29939))
* **cli:** compact bye-bye emblem and tighten SESSION RECAP layout ([ed8db50](https://github.com/Maijied/Lorapok_AI_Agent/commit/ed8db50f217168a2b57510ad58dcdedd3f2eaa49))
* **test:** strip ANSI in AI Coding badge assert for CI FORCE_COLOR ([f8db203](https://github.com/Maijied/Lorapok_AI_Agent/commit/f8db20350117be08e67cbd6ed9fa7be3d62156c8))

## [Unreleased]

### Features

* **cli:** `lib/menu-format.js` — padded icon columns for Settings, model, Git, Actions, auth, and system menus
* **cli:** API key save now live-tests provider connection (Connected / rejected / billing) for Google, OpenRouter, Perplexity
* **cli:** Fix `/bypass` menu alignment (⚡ counted as wide emoji)
* **models:** Wire `checkAvailableModels` through live sanitize/probe (fixes Perplexity `0 free accessible` after key save)
* **models:** Probe/verify use `max_tokens: 16` (Perplexity rejects `1`); clear stale access cache on key save
* **cli:** Provider browse shows all keyed models (free + paid); Perplexity Sonar catalog is 4 official models (not a large public list)
* **cli:** Category browse uses usable∩domain; Model Selection menu coverage tests; README system architecture section
* **cli:** Distinct model-status colors/icons (🟢 cyan 🔵 magenta 🟣 red 🔴 …); legend in `/help`, `/guide`, and Docs/cli/MENUS.md
* **cli:** Professional response frame (`LORAPOK · response`), heading hierarchy colors, quieter lists; `/analyze` Next steps panel; RESPONSE VIEW section in `/help`
* **cli:** Response panel soft-wraps to frame width (full rule); polished Hi/identity greeting copy
* **cli:** Fix response break — code boxes sized to panel; never wrapAnsi box borders (stops green TERMINAL bleed)
* **cli:** Professional SESSION RECAP (aligned metrics + model usage) with animated exit sequence (TTY; skipped in CI)
* **cli:** Header/theme alignment — shared 2-col gutter, framed hero+meta, welcome width match, path shorten `…/dir/name`
* **cli:** SESSION RECAP bye-bye cyber larva (animated) beside METRICS; refined `>_code;` emblem
* **tests:** 333 passing (33 suites)

## [1.4.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.3.1...v1.4.0) (2026-08-01)


### Features

* refine model access layers, monorepo layout, and CI workflows ([8ac58ac](https://github.com/Maijied/Lorapok_AI_Agent/commit/8ac58ac8d8058d35e468a25d15e5f0996cfa8ea3))
* refine model access layers, monorepo layout, and CI workflows ([a36d60e](https://github.com/Maijied/Lorapok_AI_Agent/commit/a36d60ef28682e9c5cc1e7be536783865acd4648))

## [1.3.2](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.3.1...v1.3.2) (2026-08-01)

### Features

* **models:** API-dynamic sanitized catalog with `classifyAccess`, usable vs paid views, Google free-API Pro in Currently Usable
* **cli:** `commands/registry.js` single source for `/` autocomplete, system menu, and `/help`
* **api:** Validated `GET /api/models` views, `POST /api/models/refresh`, model guards on chat/settings
* **sdk:** `@lorapok/sdk` stub under `packages/sdk` for multi-client consumers
* **docs:** Architecture, CLI, REST, and provider guides under `Docs/`
* **agents:** `.agents/rules`, hooks, automations, model-provider skill & auditor

### Bug Fixes

* **models:** `/refresh-models` no longer deletes freshly fetched cache; clears runtime failures
* **agent:** Fallback picks from live usable set; persists model only after success
* **menus:** Bypass wired in system menu; unknown slash commands show helpful error

### Changed

* **layout:** `website/` → `apps/website/`; monorepo-ready `packages/` + `Docs/`
* **tests:** 270 passing (23 suites)

## [1.3.1](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.3.0...v1.3.1) (2026-07-29)


### Bug Fixes

* **website:** Update contact email to lorapokdev@gmail.com in website footer ([b581ee1](https://github.com/Maijied/Lorapok_AI_Agent/commit/b581ee13478595a463414c024f76f1f906e615ee))

## [1.3.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.2.0...v1.3.0) (2026-07-29)


### Features

* **website:** add 32 Lorapok ecosystem products with live search & 4 categories ([8bbac25](https://github.com/Maijied/Lorapok_AI_Agent/commit/8bbac255062cd6b9b9a03aaab9205acf7c4072b2))
* **website:** add animated cybernetic SVG logo, enforce single-line typewriter animation & upgrade hero metrics ([05bb9b7](https://github.com/Maijied/Lorapok_AI_Agent/commit/05bb9b764d86a2a86e573f84606201f2df689578))
* **website:** Add Beta V2 release tags, 45-degree corner ribbon, animated larva SVG logo, collapsible ecosystem showcase, and updated documentation ([443333f](https://github.com/Maijied/Lorapok_AI_Agent/commit/443333fb5de082357474515636ba5c9fec742309))
* **website:** add Cybernetic Black Soldier Fly Larva logo component, de-duplicate footer rows & update contact email ([0ff6102](https://github.com/Maijied/Lorapok_AI_Agent/commit/0ff6102eae7b0fc9e1279c458f38c103b8826ca2))
* **website:** add global particle background, Cybernetic BSF Larva mascot, and Lorapok Research & Connect links ([a18bf85](https://github.com/Maijied/Lorapok_AI_Agent/commit/a18bf85aec050bd23bfd5dc2d7eede4779fb9ffc))
* **website:** add Research & Philosophy section and redesign Footer matching SS1, SS2, and SS3 layouts ([12f5836](https://github.com/Maijied/Lorapok_AI_Agent/commit/12f58362a4fc76ad243ef36da4b7a11a111ca09b))
* **website:** apply typography hierarchy & refine social links grid in Footer ([05bdefd](https://github.com/Maijied/Lorapok_AI_Agent/commit/05bdefdd3654d08314bc9938ad4a8379bbe558cc))
* **website:** expand Product Ecosystem to 18 Lorapok Labs products with category filter tabs ([fcd6427](https://github.com/Maijied/Lorapok_AI_Agent/commit/fcd6427463db1f33041656f3f6a12f1b44a0428d))
* **website:** hero typewriter animation, step card mini terminals, expanded multi-provider matrix & ecosystem placement ([d5829a0](https://github.com/Maijied/Lorapok_AI_Agent/commit/d5829a0c934154da5994c6cd9ba80c876277da23))
* **website:** professional glassmorphic product website for Lorapok AI ([0bd7472](https://github.com/Maijied/Lorapok_AI_Agent/commit/0bd7472c9ebc2dd5ac8ae437189b8080b6978829))
* **website:** redesign Cybernetic Larva widget into interactive Labs Hub modal & clean top nav ([506ab32](https://github.com/Maijied/Lorapok_AI_Agent/commit/506ab32a84ab49ee2244723bd52a364896ff30c0))
* **website:** update brand logo & name to IntelliJ JetBrains Mono style and move typewriter animation to top center ([7c5510f](https://github.com/Maijied/Lorapok_AI_Agent/commit/7c5510f32d911daa249dc2ec4579fa98226b8e59))
* **website:** upgrade website to Vite + React with Agentic Coding Simulation & Lorapok Labs Ecosystem ([d8f6664](https://github.com/Maijied/Lorapok_AI_Agent/commit/d8f666486168845e621b6a60b3f2bc630496002a))


### Bug Fixes

* **ci:** Remove environment protection constraint to enable GitHub Pages deployment on Website branch ([ed016c4](https://github.com/Maijied/Lorapok_AI_Agent/commit/ed016c43d09d3d30425328ebbad76a608c802b1f))
* **website:** relocate mascot widget to bottom-right, enhance color scheme & add social/email links in footer ([3a4a8d2](https://github.com/Maijied/Lorapok_AI_Agent/commit/3a4a8d2b84310fe1f98942b93f2a8a69659a0ad3))
* **website:** remove turbovec and deduplicate ecosystem products ([2469df0](https://github.com/Maijied/Lorapok_AI_Agent/commit/2469df01202954c9a6a8d061dcd51207b4727114))
* **website:** resolve navbar header text overlapping and z-index layout issues ([efde6f6](https://github.com/Maijied/Lorapok_AI_Agent/commit/efde6f69473c151326311fbaef53b445a4938dc0))
* **website:** restore complete glassmorphic CSS design system and standardize typography rules ([69a6498](https://github.com/Maijied/Lorapok_AI_Agent/commit/69a64980997e2e6a8d8d773842c854b794dc6853))

## [1.2.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.1.0...v1.2.0) (2026-07-28)


### Features

* Add Autonomous Agents, Image, Audio, Video, and Open Weights categories to CLI category filter menu ([43dc42e](https://github.com/Maijied/Lorapok_AI_Agent/commit/43dc42ea62d48437e5ae7f626be9671a0af30eaf))
* Add DEFAULT_OPENROUTER_MODELS fallback catalog to ModelManager ([1943f65](https://github.com/Maijied/Lorapok_AI_Agent/commit/1943f654009994a11a71b41da4afd4458b21f016))
* Add dynamic token capacity and remaining token limit counter to chat response footer ([ad129a6](https://github.com/Maijied/Lorapok_AI_Agent/commit/ad129a69de59dac5d9b7e10a31d9c981d886ecd0))
* Add ModelCacheService and dynamic modality/quota validation to replace static excluded models array ([6029d76](https://github.com/Maijied/Lorapok_AI_Agent/commit/6029d768199803598f00fc7468a50188c8aa1f6b))
* Add ModelValidator middleware service to filter out unusable models from selection menu ([173446b](https://github.com/Maijied/Lorapok_AI_Agent/commit/173446b07c7d2e5eae0f92d80d15917d3603cf04))
* Add native Google AI Studio (Gemini) provider integration & dynamic model fetching ([b01e4ec](https://github.com/Maijied/Lorapok_AI_Agent/commit/b01e4ecaa04942cf5fab464cfd6fa5a7ad8a1afc))
* Add professional vendor icon mappings for Grok, Poolside, Ling, Cohere, Baichuan, Yi, Stepfun, and AI models ([f62b494](https://github.com/Maijied/Lorapok_AI_Agent/commit/f62b494ff0cbcc80ed0a1615868a276dc7d786a4))
* Add quota reset windows and retry-after header handling across error messages and model UI selector ([6416d1a](https://github.com/Maijied/Lorapok_AI_Agent/commit/6416d1a0b76942aab89eb723a34e5304faeee6ea))
* Add rate limit, quota, and context window usage tags to model selection UI across all AI providers ([b50fa52](https://github.com/Maijied/Lorapok_AI_Agent/commit/b50fa5250b74cac87ffd5dc20d0800b3f3e70c0f))
* Dynamically extract and format context and pricing limits directly from live API responses ([825e049](https://github.com/Maijied/Lorapok_AI_Agent/commit/825e049a18211b85ab631a132181121f575507b9))
* Dynamically process all models supporting generateContent from Google AI Studio response ([460cdf5](https://github.com/Maijied/Lorapok_AI_Agent/commit/460cdf5cb5b4d574a8b4dab7506849fc1be999a4))
* Enforce universal free vs credit-required model filtering across all providers (Google AI Studio, Perplexity, OpenRouter) ([9351cfd](https://github.com/Maijied/Lorapok_AI_Agent/commit/9351cfd01a4f6a87dbbf77c010e1aaed78bc27de))
* Exclude zero-quota model gemini-2.5-pro from catalog and add automatic fallback model routing on 429/404 errors ([7738cf3](https://github.com/Maijied/Lorapok_AI_Agent/commit/7738cf34cd828df69ff7a4e341748a5384340b24))
* Extract dedicated ModelValidator service in services/ModelValidator.js with unit test suite ([6bdd79d](https://github.com/Maijied/Lorapok_AI_Agent/commit/6bdd79d19490c1bbe39c35a3907bfca7211d35e4))
* Modularize renderTokenUsageBox helper and render structured model card after every AI response ([6824338](https://github.com/Maijied/Lorapok_AI_Agent/commit/6824338a572e9bef146820232f45eb620f4003c8))
* Restrict ready/category/provider/tier selection to free active models and categorize paid credit models under View All Supported Models ([a85e58f](https://github.com/Maijied/Lorapok_AI_Agent/commit/a85e58f8171415ca1e12b7b33beb59ee5321748e))
* Standardize dynamic rate limit parsing, quota reset tips, and retry headers across all 3 AI providers (Google AI Studio, OpenRouter, Perplexity) ([6978f19](https://github.com/Maijied/Lorapok_AI_Agent/commit/6978f19554c9924dba4969ed1a0df16ddf8ee10b))


### Bug Fixes

* Define isPerplexity variable and route recursive fallback calls through callPerplexityAPI ([b012fb3](https://github.com/Maijied/Lorapok_AI_Agent/commit/b012fb356cda9eb0806a1aaa381dbc573ebb70f0))
* Dynamically record and report fallback model usage in card boxes, header cards, and session recap breakdown ([ae18fd2](https://github.com/Maijied/Lorapok_AI_Agent/commit/ae18fd227759224a390e0c354a3f9b1a8770a89e))
* Exclude zero-quota and deprecated Google AI Studio models from ready selection catalog ([b864e17](https://github.com/Maijied/Lorapok_AI_Agent/commit/b864e17a532323b1e7ab097e7e8b4c32e9dc589b))
* Import chalk library in lib/agent.js for error fallback formatting ([d4eb687](https://github.com/Maijied/Lorapok_AI_Agent/commit/d4eb6875ff152d74e0320e4ad4de4874fb7499c0))
* Parse Google AI Studio array error responses and format 429/404 messages ([1502eb5](https://github.com/Maijied/Lorapok_AI_Agent/commit/1502eb53cdbf9a03ab03befcdddc9bbbf014fb26))
* Replace deprecated gemini-1.5-flash model with active models (gemini-2.5-flash, gemini-2.0-flash) and filter unavailable models ([43eba59](https://github.com/Maijied/Lorapok_AI_Agent/commit/43eba593967c00f5044559d556c54fc29a377c7b))
* Resolve duplicate activeModelMeta identifier declaration in commands/chat.js ([38ffce7](https://github.com/Maijied/Lorapok_AI_Agent/commit/38ffce7840bb0e6a214e00dcccaee9c9329ce282))
* Sub-brand icon resolution logic ensuring Gemini Pro, Flash, TTS, Tools, and Image models render unique distinct icons ([df84b50](https://github.com/Maijied/Lorapok_AI_Agent/commit/df84b50b05b0da44d36a7ca9e64a99421f9fbf3c))
* Update Fast & Lightweight icon to 🚀 Rocket and enhance /analyze output rendering and error visibility ([c38e4a7](https://github.com/Maijied/Lorapok_AI_Agent/commit/c38e4a7435e07c19a5f8ae3e57cc744639019359))

## [1.1.0](https://github.com/Maijied/Lorapok_AI_Agent/compare/v1.0.0...v1.1.0) (2026-07-28)


### Features

* add multi-model support and provider selection for OpenRouter and Perplexity AI ([574165a](https://github.com/Maijied/Lorapok_AI_Agent/commit/574165a9dfc17e1e4c35b49aed48333eaedba116))
* Add professional hierarchical menu for Model Selection with Availability, Category, Provider, and Tier filtering ([0b62161](https://github.com/Maijied/Lorapok_AI_Agent/commit/0b621611348173bb998a050068d96ec252904c48))

## [Unreleased]

### Added
- Created `services/ModelValidator.js` for dynamic model usability validation, zero-quota free tier model filtering, and non-text modality exclusion.
- Created `services/ModelCacheService.js` for in-memory model catalog caching and runtime API failure tracking (`addFailedModel`).
- Native Google AI Studio (Gemini) provider integration supporting `GEMINI_API_KEY` and `GOOGLE_API_KEY` environment variables.
- Dynamic Google AI Studio model fetching directly from `https://generativelanguage.googleapis.com/v1beta/models` API endpoint with static fallback.
- Multi-provider dynamic API querying for Model Selection (Perplexity, OpenRouter, Google AI Studio).
- Professional hierarchical nested settings menu for Model Selection filtering by Category, Provider, Availability, and Pricing Tier.
- Restricted `Ready Models`, `Category`, `Provider`, and `Pricing Tier` selection menus to free active models across all 3 providers without credit purchase requirements.
- Categorized paid/credit-required models under `View All Supported Models` with clear `💳 (Credit Purchase Required)` status indicators and provider credit purchase instructions.
- Clean `boxen`-wrapped professional UI for rendering turn token usage, active model name, and remaining token capacity limit directly in chat responses and `/analyze` command outputs.

### Fixed
- Fixed automatic fallback model routing metrics so fallback model execution (`gemini-2.5-flash`) is dynamically credited in status cards, header cards, and session recap tables.
- Fixed an architectural bug where the `LorapokConfig` state would become stale in memory, routing models incorrectly to the wrong API endpoints.

## 1.0.0 (2026-07-28)


### Features

* **actions:** add rerun capability, smart status icons, and UI standardization ([60e0441](https://github.com/Maijied/Lorapok_AI_Agent/commit/60e04417cf39408ead432d84a0f8910c8ef4bf0c))
* add agent workflow scaffolding ([4924870](https://github.com/Maijied/Lorapok_AI_Agent/commit/4924870cc95505cd957a3daf5ae08370df7353a6))
* Add Docker support and README ([e8c3d49](https://github.com/Maijied/Lorapok_AI_Agent/commit/e8c3d49577d3575b3cd7e3c4d8201694bdcb46a5))
* add project run checklist and update request brief ([d4792b2](https://github.com/Maijied/Lorapok_AI_Agent/commit/d4792b27adfd65cafcfe16cee329721786e733e5))
* added bash command support with user confirmation and output capture ([5d19f27](https://github.com/Maijied/Lorapok_AI_Agent/commit/5d19f273b2ef6ef91abced0a144d912047fa26fc))
* **agents:** add BRAIN system memory, custom skills, subagents, MCP config, and clean project structure ([19dbbf6](https://github.com/Maijied/Lorapok_AI_Agent/commit/19dbbf68868d62632fc4ff3393ff681d81584ed4))
* **agents:** add workspace token-efficiency skill, steer guide, subagent, and rules ([d54c38e](https://github.com/Maijied/Lorapok_AI_Agent/commit/d54c38e188693796efed151f06e8cf3752f2d86b))
* **auth:** implement professional Device Flow & GitHub CLI authentication suite ([b7f298b](https://github.com/Maijied/Lorapok_AI_Agent/commit/b7f298bf6d695b800239026430ffa014dfdcead1))
* **auth:** Implement professional unified Git authentication system ([9bb5c57](https://github.com/Maijied/Lorapok_AI_Agent/commit/9bb5c57b69ad25122813f5c43b2ad3a105380380))
* **bash:** perfect bash command parsing, inline command execution, and expanded action regex ([b8ca289](https://github.com/Maijied/Lorapok_AI_Agent/commit/b8ca289353644f8e1b321d664d00b6a0d3dbf7e0))
* **cache,cli:** add LLM response caching engine and collapsible bash execution process box ([0dbb84e](https://github.com/Maijied/Lorapok_AI_Agent/commit/0dbb84e5dee0697df4aa9217fe3341962fbf8e75))
* complete command ecosystem with DooD (Docker-outside-of-Docker) and native OS support ([645cce9](https://github.com/Maijied/Lorapok_AI_Agent/commit/645cce976b1ecaaa93a4ac9c5124504e157bd660))
* **core:** stability overhaul & identity reinforcement ([3f88464](https://github.com/Maijied/Lorapok_AI_Agent/commit/3f8846447d20d11bb103d40f2883ea44458c33b0))
* expand language support to 60+ langs and enhance action parsing ([dadd463](https://github.com/Maijied/Lorapok_AI_Agent/commit/dadd46377cd23a542c3347a1ed05e18c3b169988))
* fix CLI design, add comprehensive corner-case tests (155 tests passing) ([d6c0313](https://github.com/Maijied/Lorapok_AI_Agent/commit/d6c03138c4e04a9abb1b39466ca4b20bbd6d4ba7))
* implement professional identity override for Lorapok agent ([70e675b](https://github.com/Maijied/Lorapok_AI_Agent/commit/70e675b67261e51292130ba9bf76fd72e378a1a9))
* Initial release - Lorapok AI Coding Agent v1.0.0 ([d0ad4de](https://github.com/Maijied/Lorapok_AI_Agent/commit/d0ad4de6e803c042b9e617401c4fd66584066f27))
* Lorapok Pro v1.0.0-beta.1 release ([e5850ea](https://github.com/Maijied/Lorapok_AI_Agent/commit/e5850ea56b6e08e8568e9818b6aa47c29c4a32b1))
* persistent shell sessions and improved bash tool robustness ([0243958](https://github.com/Maijied/Lorapok_AI_Agent/commit/024395823da5212a7117d629738d275413b87f53))
* reinforce Lorapok agent identity in system prompt ([1d9ad28](https://github.com/Maijied/Lorapok_AI_Agent/commit/1d9ad28cd42042d0e91a0478088dd71377b30131))
* **services:** add multiReplaceFileContent primitive and verify all workspace skills/steer/subagents ([aed3475](https://github.com/Maijied/Lorapok_AI_Agent/commit/aed34759985c83b6866973bbfb711176b277ae2c))
* **services:** implement viewFile, replaceFileContent, grepSearch, and listDir primitives ([6d48143](https://github.com/Maijied/Lorapok_AI_Agent/commit/6d481433a0f7e8c782331099a457fed4c04f1968))
* **ui:** complete UI polish and functionality improvements ([58894e2](https://github.com/Maijied/Lorapok_AI_Agent/commit/58894e22efe6c86904bf8597f63568ea70f45928))
* **ui:** complete ui polish, settings themes, exit summary, and update docker/documentation ([afb4a83](https://github.com/Maijied/Lorapok_AI_Agent/commit/afb4a839f7f1e3c2fe0bada7f445d4141f03972a))
* **ui:** enhance branding with animation, themes, and polished layout ([dcc168f](https://github.com/Maijied/Lorapok_AI_Agent/commit/dcc168f2705420e68d1f5aa6782553aeaa018bd9))
* **ui:** enhanced markdown rendering with marked & marked-terminal ([406d1e0](https://github.com/Maijied/Lorapok_AI_Agent/commit/406d1e09a499842b29648b1715af3765fcbb82ea))
* universal shell support with bash/curl pre-installed and cross-platform native execution ([d309ff9](https://github.com/Maijied/Lorapok_AI_Agent/commit/d309ff9139580b3e74be3905abd5a4819278a4c1))
* **ux:** premium terminal UI with high-contrast rendering, smart table pivot, and robust API recovery ([d673667](https://github.com/Maijied/Lorapok_AI_Agent/commit/d673667630f6ea29104152b648c1a33eeb9c704a))
* **website:** add futuristic AI agent site ([27520a5](https://github.com/Maijied/Lorapok_AI_Agent/commit/27520a5e7f581ae082eca73b7f44f097529c9349))
* **website:** add professional Lorapok Pages build and Node 24+ Enquirer fix ([7b5d72e](https://github.com/Maijied/Lorapok_AI_Agent/commit/7b5d72ea7438379f7e3252922feb599c68c5be3a))


### Bug Fixes

* **ci,test:** isolate git user config per test suite and add fail-fast false to CI matrix ([2423080](https://github.com/Maijied/Lorapok_AI_Agent/commit/2423080e95873ebf0a994d2d751cdef73e5cb533))
* **ci:** add GITHUB_TOKEN authentication to release-please action step ([ae35863](https://github.com/Maijied/Lorapok_AI_Agent/commit/ae358637a03242390cc2abf34d9e6a729c421555))
* **ci:** improve cross-platform OS compatibility (macOS/Windows) and expand Node.js matrix [18.x, 20.x, 22.x, 24.x] ([23943d2](https://github.com/Maijied/Lorapok_AI_Agent/commit/23943d2530d68f978b965f07fbeafb60c5f96009))
* **git,test:** normalize CRLF line endings in GitManager and path resolution in CWD unit tests ([f7292df](https://github.com/Maijied/Lorapok_AI_Agent/commit/f7292df2e5cccf9cbd71e8f570581f8652254992))
* installed missing docker-compose plugin ([1c64f73](https://github.com/Maijied/Lorapok_AI_Agent/commit/1c64f73ade295c33264c0f950af7eaf260d57685))
* prevented greedy action parsing from capturing multiple code blocks ([c2d2b71](https://github.com/Maijied/Lorapok_AI_Agent/commit/c2d2b713280a3d16030460d119cd708c1c8a8d3e))
* Update Express route syntax for compatibility ([1ee53f8](https://github.com/Maijied/Lorapok_AI_Agent/commit/1ee53f857a48d2e75abac5043b158ba42932e167))
* **utils,ci:** resolve macOS symlink CWD mismatch in utils.js and restore Node 18.x matrix support ([8217c32](https://github.com/Maijied/Lorapok_AI_Agent/commit/8217c32a1a1f6e5a71893a0d6186c743924f7933))
* **utils:** pre-expand ~ tilde in cd commands for Windows cmd.exe shell execution ([269cb2c](https://github.com/Maijied/Lorapok_AI_Agent/commit/269cb2c33d747508b4bdd5fac1e7ed3c59347d21))
* **windows:** normalize Windows 8.3 short paths and CRLF line breaks in FileManager and utils tests ([81fd977](https://github.com/Maijied/Lorapok_AI_Agent/commit/81fd9775932730b0d9abc6edeccb07fa904ac14c))

## [1.0.0] - 2026-07-23

### Added
- Initial production-ready release of the Lorapok AI Coding Agent 🐛
- Interactive terminal REPL powered by Perplexity AI models (`sonar`, `sonar-pro`, `sonar-reasoning`)
- Proactive file actions system (CREATE, UPDATE, DELETE) with interactive code viewport diff previews
- Safe bash command execution with safety confirmations and persistent CWD tracking
- Full Git integration suite (status, diff, smart AI commit message generation, branch management, push/pull, stashing)
- GitHub Actions manager for browsing, inspecting, and triggering workflow runs
- GitHub authentication system supporting Personal Access Tokens, OAuth Device Flow, and GitHub CLI credential sharing
- Express REST API server (`server.js`) on port 3847 with session management and health monitoring
- Docker containerization architecture with automatic host volume mounting
- Enterprise documentation suite (`README.md`, `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`)

### Changed
- Refactored monolithic `index.js` into modular command handlers (`commands/git.js`, `commands/actions.js`, `commands/auth.js`, `commands/settings.js`, `commands/workflow.js`, `commands/utils.js`)
- Standardized service return signature to `{ success, data, error }` across `GitManager`, `FileManager`, `ActionsManager`, and `GithubAuth`
- Enhanced UI renderer with 12 ASCII logo font options, animated startup, and markdown syntax highlighting

### Fixed
- Fixed CWD tracking concatenation bug in `executeCommand()`
- Fixed duplicate `setLogger()` calls in CLI initialization
- Fixed duplicate key definitions in `langMap` and `LANG_DISPLAY`
- Fixed Express server DELETE session cleanup memory leak
- Fixed hardcoded user path assumptions in Docker compose configuration
- Redacted sensitive tokens in `GitManager` log outputs to prevent credential leaks

### Security
- Added input sanitization and command whitelisting to block dangerous shell injection patterns in `executeCommand()`

---
*Built with 🐛 by Lorapok Labs (https://lorapok.tech)*
