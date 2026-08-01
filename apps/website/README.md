<div align="center">

<img src="../assets/lorapok-larva-logo.svg" alt="Lorapok AI Logo" width="140" />

# 🌐 Lorapok AI Agent — Web Presentation & Ecosystem Directory

**The official high-performance web presentation, interactive CLI simulation, and ecosystem directory for Lorapok AI Agent.**

[![Build & Deploy](https://github.com/Maijied/Lorapok_AI_Agent/actions/workflows/deploy-website.yml/badge.svg)](https://github.com/Maijied/Lorapok_AI_Agent/actions/workflows/deploy-website.yml)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[**Live Web App (ai.lorapok.tech)**](https://ai.lorapok.tech) • [**Lorapok Hub (lorapok.tech)**](https://lorapok.tech) • [**GitHub Repository**](https://github.com/Maijied/Lorapok_AI_Agent)

</div>

---

## ⚡ Overview

The `apps/website/` package is a single-page application (SPA) built using **React 18**, **Vite 5**, and **Vanilla Glassmorphic CSS**. It serves as the official frontend website for **Lorapok AI Agent**, featuring:

- 🐛 **Cybernetic BSF Larva Biological UI Design**: Signature mascot aesthetics with glowing neon-green & cyan glassmorphism.
- 💻 **Live Agentic Terminal Simulation**: Real-time terminal playback (`AgenticSimulation.jsx`) showcasing code refactoring, test generation, and bug fixing.
- 🗂️ **34-Product Ecosystem Directory**: Interactive searchable showcase (`Ecosystem.jsx`) featuring all open-source projects created by Mohammad Maizied Hasan Majumder.
- 🔬 **Research & Philosophy Specs**: Core engineering themes, founder quotes, open-source commitment, and future vision banners.
- 🔀 **Atlas-Style 5-Column Footer**: Categorized resources, features, dependencies, and official contact channels.

---

## 🛠️ Tech Stack & Architecture

- **Core**: React 18, JSX, JavaScript (ES2022)
- **Bundler & Dev Server**: Vite 5.4.21
- **Styling**: Vanilla Glassmorphic CSS system (`src/styles/index.css`) with CSS `@keyframes` animations
- **Typography**: Google Fonts — `Inter` (Display/Body) & `JetBrains Mono` (Code/Commands/Brand)
- **Deployment**: Static Single Page Application deployed to GitHub Pages (`ai.lorapok.tech`)

---

## 📁 Directory Structure

```
apps/website/
├── index.html                  # HTML entrypoint & meta tags
├── package.json                # Website dependencies & build scripts
├── vite.config.js              # Vite bundler configuration
├── README.md                   # Web presentation documentation
├── public/                     # Static assets & favicon icons
│   └── favicon.ico
└── src/
    ├── main.jsx                # React root renderer
    ├── App.jsx                 # Main application layout & modal controller
    ├── components/
    │   ├── Navbar.jsx          # Top fixed navigation header & drawer
    │   ├── Hero.jsx            # Hero section with single-line typewriter & stats
    │   ├── LarvaLogo.jsx       # Animated Cybernetic BSF Larva SVG logo component
    │   ├── AgenticSimulation.jsx # Live terminal simulation with background watermark
    │   ├── Features.jsx        # Core CLI & Agent features grid
    │   ├── HowItWorks.jsx      # 4-step workflow guide
    │   ├── Ecosystem.jsx       # Searchable 34-product ecosystem showcase
    │   ├── Providers.jsx       # Multi-model AI provider breakdown
    │   ├── ResearchPhilosophy.jsx # Research principles & founder quote
    │   ├── Pricing.jsx         # Open Source & Free tier cards
    │   ├── GlobalParticleCanvas.jsx # Floating background particle canvas
    │   ├── CyberneticLarvaMascot.jsx # Floating mascot companion modal
    │   └── Footer.jsx          # Atlas-style 5-column footer
    ├── data/
    │   ├── ecosystemProjects.js # 34-project ecosystem dataset
    │   └── simulationSteps.js   # Terminal execution scenarios
    └── styles/
        └── index.css           # Glassmorphic design tokens & responsive CSS
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Installation & Execution

1. Navigate to the `apps/website/` directory:
   ```bash
   cd apps/website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build production bundle:
   ```bash
   npm run build
   ```
   Output bundle is compiled into `apps/website/dist/`.

---

## 📦 Deployment Workflow

The production build of `apps/website/` is automatically deployed to GitHub Pages via [`.github/workflows/deploy-website.yml`](../../.github/workflows/deploy-website.yml) on pushes to `main` or `Website` (path-filtered to `apps/website/**`).

---

## 📄 License & Attribution

Built with precision by **Mohammad Maizied Hasan Majumder** for **Lorapok Labs**.
Released under the **MIT License**.
