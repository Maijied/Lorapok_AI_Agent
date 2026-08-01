import React from 'react';
import LarvaLogo from './LarvaLogo';
import { ecosystemLinks } from '../data/ecosystemProjects';

const bottomSocialLinks = [
  { name: 'GitHub Org', url: ecosystemLinks.githubOrg, icon: '🐙' },
  { name: 'Developer GitHub', url: ecosystemLinks.developerGithub, icon: '👤' },
  { name: 'LinkedIn Showcase', url: 'https://linkedin.com/showcase/lorapok/', icon: '💼' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com/products/lorapok-atlas-api-directory', icon: '🚀' },
  { name: 'Reddit Community', url: 'https://reddit.com/r/LorapokLabs/', icon: '💬' },
  { name: 'Instagram', url: 'https://instagram.com/lorapoklabs/', icon: '📷' },
  { name: 'Facebook', url: 'https://facebook.com/lorapoklabs', icon: '👥' },
  { name: 'Wellfound Profile', url: 'https://wellfound.com/u/maizied', icon: '💼' },
  { name: 'Developer Portfolio', url: 'https://maijied.github.io/Maijied', icon: '🌐' }
];

export default function Footer() {
  return (
    <footer className="footer" id="footer" style={{ background: '#030711', borderTop: '1px solid var(--border-glass)', padding: '5rem 2rem 2.5rem' }}>
      <div className="container">

        {/* ── Section Header & Philosophy Banner ── */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '0.75rem'
            }}
          >
            <span className="gradient-text">Building the Future.</span>
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
              letterSpacing: '-0.01em'
            }}
          >
            Lorapok Labs Ecosystem
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '540px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.6
            }}
          >
            Products that feel alive, built with precision.
          </p>

          {/* Mono Code Banner */}
          <div
            style={{
              display: 'inline-block',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-cyan)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.5rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.92rem',
              color: '#22D3EE',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.15)'
            }}
          >
            <span style={{ color: 'var(--accent-purple-light)' }}>const</span> future = <span style={{ color: '#10B981' }}>buildOneLineAtATime</span>();
          </div>
        </div>

        {/* ── Sleek 5-Column Grid Layout (Atlas-Style) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1.1fr 1.1fr',
            gap: '2.5rem',
            marginBottom: '4rem',
            alignItems: 'start'
          }}
          className="atlas-footer-grid"
        >
          {/* Col 1: Brand, Description, Badges & Stats */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <LarvaLogo size={42} showText={false} />
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Lorapok <span className="gradient-text">AI</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', uppercase: 'true' }}>
                  TERMINAL AI AGENT
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              The terminal-first autonomous coding agent. Plan, scaffold, execute test suites, and commit code with multi-provider AI — zero config, live terminal simulation.
            </p>

            {/* Badges Row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(34, 211, 238, 0.12)', border: '1px solid var(--border-cyan)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                186+ Tests
              </span>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid var(--border-purple)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-purple-light)', fontFamily: 'JetBrains Mono, monospace' }}>
                3 Core Engines
              </span>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.74rem', fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                Open Source
              </span>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.74rem', fontWeight: 700, color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
                MIT License
              </span>
            </div>

            {/* Metrics Numbers Row */}
            <div style={{ display: 'flex', gap: '1.75rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace' }}>186</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>UNIT TESTS</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-purple-light)', fontFamily: 'JetBrains Mono, monospace' }}>25+</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>LLM MODELS</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>0ms</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>LATENCY</div>
              </div>
            </div>
          </div>

          {/* Col 2: — FEATURES (Cyan Accent Heading) */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
              — FEATURES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🧪 Autonomous Agent Plan</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💻 Live Terminal Simulation</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🛠️ Multi-Provider AI Routing</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔒 OAuth &amp; Security Manager</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚡ Zero-Config CLI Engine</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔄 Git Branch &amp; PR Manager</span>
            </div>
          </div>

          {/* Col 3: — RESOURCES (Purple Accent Heading) */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple-light)', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
              — RESOURCES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent" target="_blank" rel="noopener noreferrer" className="footer-link">📖 Source Code</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/issues" target="_blank" rel="noopener noreferrer" className="footer-link">🎯 Report Issue</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent" target="_blank" rel="noopener noreferrer" className="footer-link">🤝 Contribute</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="footer-link">📝 README.md</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/AGENTS.md" target="_blank" rel="noopener noreferrer" className="footer-link">🤖 AGENTS.md</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="footer-link">⚡ Changelog</a>
            </div>
          </div>

          {/* Col 4: — BUILT WITH (Neon Green Accent Heading) */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
              — BUILT WITH
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🟢 Node.js 18+ &amp; CommonJS</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚡ Vite 5 &amp; React 18</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎨 Glassmorphic CSS</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🧠 Google Gemini 2.5 / 3.6</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔀 OpenRouter Multi-LLM</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔍 Perplexity AI Search</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🧪 Jest Test Runner</span>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔒 Express.js REST API</span>
            </div>
          </div>

          {/* Col 5: — ECOSYSTEM (Amber Accent Heading) */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 800, color: '#F59E0B', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
              — ECOSYSTEM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <a href={ecosystemLinks.npmPackage} target="_blank" rel="noopener noreferrer" className="footer-link">📦 npm: lorapok-ai</a>
              <a href={ecosystemLinks.labsWebsite} target="_blank" rel="noopener noreferrer" className="footer-link">🌐 Lorapok Hub</a>
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/research" target="_blank" rel="noopener noreferrer" className="footer-link">🔬 Lorapok Research</a>
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/connect" target="_blank" rel="noopener noreferrer" className="footer-link">🌐 Connect &amp; Telemetry</a>
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/" target="_blank" rel="noopener noreferrer" className="footer-link">📖 Lorapok Labs Bible</a>
              <a href={ecosystemLinks.githubOrg} target="_blank" rel="noopener noreferrer" className="footer-link">🐙 GitHub Org</a>
              <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer" className="footer-link">👤 Developer Portfolio</a>
              <a href="mailto:lorapokdev@gmail.com" className="footer-link" style={{ color: '#00FF88', fontWeight: 700 }}>✉️ lorapokdev@gmail.com</a>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar with All Social Profiles & Location Badge ── */}
        <div className="footer-bottom" style={{ flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {/* Social Icon Pills Row */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {bottomSocialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderColor: 'var(--border-glass)'
                }}
                title={social.name}
              >
                <span>{social.icon}</span>
                <span>{social.name}</span>
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🐛</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Lorapok Labs · Bangladesh
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              © 2026 Lorapok Labs. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
