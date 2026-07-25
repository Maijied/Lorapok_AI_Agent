# Contributing to Lorapok AI Coding Agent 🐛

First off, thank you for taking the time to contribute to Lorapok AI Coding Agent! We welcome contributions from developers of all skill levels.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Conventional Commit Format](#conventional-commit-format)
- [Testing Requirements](#testing-requirements)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the Lorapok [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to `info@lorapok.tech`.

---

## 🔧 Prerequisites

Before you begin development, make sure you have:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher
- **Git**: `v2.30.0` or higher
- **Docker & Docker Compose** *(Optional, recommended for testing)*: Docker `≥20.0.0`

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub: [https://github.com/Maijied/Lorapok_AI_Agent](https://github.com/Maijied/Lorapok_AI_Agent)
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lorapok_AI_Agent.git
   cd Lorapok_AI_Agent
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set PERPLEXITY_API_KEY=pplx-your-key
   ```
5. **Run local CLI during development**:
   ```bash
   node bin/lorapok.js --local
   ```

---

## 🛠️ Development Workflow

- Maintain strict separation of concern:
  - Command handlers in `commands/`
  - Core logic and utilities in `lib/`
  - External services in `services/`
  - Server endpoints in `server.js`
  - Tests co-located in `tests/`
- Every source JS file must include `'use strict';` and the Lorapok Labs copyright header at line 1.
- Public methods should include JSDoc comments describing parameters and standard return shape (`{ success, data, error }`).

---

## 💬 Conventional Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning via `release-please`. Your commit messages must follow this structure:

```
<type>(<scope>): <short description>
```

### Supported Types:
- `feat`: A new feature for the user
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, code style updates
- `refactor`: Code restructuring without changing behavior
- `test`: Adding or updating unit/integration tests
- `chore`: Build process, dependencies, auxiliary tool updates

### Examples:
- `feat(git): add support for cherry-pick slash command`
- `fix(actions): sanitize input parameters for shell execution`
- `docs(readme): add Docker installation instructions`

---

## 🧪 Testing Requirements

All contributions must pass existing tests and include new test coverage for added features or bug fixes.

```bash
# Run test suite locally
npm test

# Run tests in Docker container
npm run test:docker
```

- Target minimum unit test coverage is **70%**.
- Ensure tests run cleanly without leaving dangling process resources or unhandled promise rejections.

---

## 📥 Submitting a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-amazing-feature
   ```
2. Make your code changes and commit using Conventional Commits.
3. Run test suite: `npm test`.
4. Push your feature branch to your fork:
   ```bash
   git push origin feat/my-amazing-feature
   ```
5. Open a Pull Request against the `main` branch of `Maijied/Lorapok_AI_Agent`.
6. Fill out the PR template with clear description, testing instructions, and linked issue numbers.

---

<div align="center">

*Built with 🐛 by [Lorapok Labs](https://lorapok.tech)*

</div>
