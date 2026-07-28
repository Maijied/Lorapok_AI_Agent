import React from 'react';
import { ecosystemLinks } from '../data/ecosystemProjects';

const socialCards = [
  {
    name: 'GitHub',
    url: 'https://github.com/maijied',
    displayUrl: 'github.com/maijied',
    icon: '</>'
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/showcase/lorapok/',
    displayUrl: 'linkedin.com/showcase/lorapok/',
    icon: '💼'
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/products/lorapok-atlas-api-directory',
    displayUrl: 'producthunt.com/products/lorapok...',
    icon: '🚀'
  },
  {
    name: 'Reddit',
    url: 'https://reddit.com/r/LorapokLabs/',
    displayUrl: 'reddit.com/r/LorapokLabs/',
    icon: '💬'
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/lorapoklabs/',
    displayUrl: 'instagram.com/lorapoklabs/',
    icon: '📷'
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/lorapoklabs',
    displayUrl: 'facebook.com/lorapoklabs',
    icon: '👥'
  },
  {
    name: 'Wellfound',
    url: 'https://wellfound.com/u/maizied',
    displayUrl: 'wellfound.com/u/maizied',
    icon: '💼'
  },
  {
    name: 'Portfolio',
    url: 'https://maijied.github.io/Maijied',
    displayUrl: 'maijied.github.io/Maijied',
    icon: '🌐'
  },
  {
    name: 'OSS Ecosystem',
    url: 'https://lorapok.github.io',
    displayUrl: 'lorapok.github.io',
    icon: '📦'
  }
];

export default function Footer() {
  return (
    <footer className="footer" id="footer" style={{ background: '#030711', borderTop: '1px solid var(--border-glass)' }}>
      <div className="container">
        {/* Top Quick Links Pill Row (Matching SS1) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <a href={ecosystemLinks.githubOrg} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            &lt;/&gt; Org
          </a>
          <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', borderColor: '#10B981', color: '#10B981' }}>
            🌐 Founder
          </a>
          <a href="https://gravatar.com/maijied" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            🌐 Gravatar
          </a>
          <a href="https://reddit.com/r/LorapokLabs/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            🌐 Reddit
          </a>
          <a href="https://twitter.com/lorapoklabs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            🌐 X
          </a>
          <a href="mailto:contact@lorapok.tech" className="btn btn-secondary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            ✉️ Email
          </a>
        </div>

        {/* Social Cards 3x3 Grid (Matching SS2) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
          {socialCards.map((card) => (
            <a
              key={card.name}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card glass-card-interactive"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.6)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(34, 211, 238, 0.12)',
                    border: '1px solid var(--border-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    color: '#10B981'
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{card.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {card.displayUrl}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>↗</span>
            </a>
          ))}
        </div>

        {/* Traditional Footer Main Grid */}
        <div className="footer-grid" style={{ marginBottom: '3rem' }}>
          <div>
            <div className="footer-brand">
              <img src="assets/logo.png" alt="Lorapok AI" />
              <span className="footer-brand-name">
                Lorapok <span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="footer-description">
              Independent Open-Source Ecosystem. Building the Future. One Line at a Time. Experimental developer tools with a signature Biological UI aesthetic.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Research &amp; Specs</h4>
            <div className="footer-links">
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/research" className="footer-link" target="_blank" rel="noopener noreferrer">Lorapok Research 🔬</a>
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/connect" className="footer-link" target="_blank" rel="noopener noreferrer">Connect &amp; Telemetry 🌐</a>
              <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/" className="footer-link" target="_blank" rel="noopener noreferrer">Lorapok Labs Bible 📖</a>
              <a href="https://ai.lorapok.tech" className="footer-link">Lorapok AI Hub 🤖</a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Resources</h4>
            <div className="footer-links">
              <a href={ecosystemLinks.githubOrg} className="footer-link" target="_blank" rel="noopener noreferrer">GitHub Org</a>
              <a href={ecosystemLinks.npmPackage} className="footer-link" target="_blank" rel="noopener noreferrer">npm Package</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/CHANGELOG.md" className="footer-link" target="_blank" rel="noopener noreferrer">Changelog</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/LICENSE" className="footer-link" target="_blank" rel="noopener noreferrer">MIT License</a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Contact &amp; Support</h4>
            <div className="footer-links">
              <a href="mailto:contact@lorapok.tech" className="footer-link">contact@lorapok.tech</a>
              <a href="mailto:maijied@gmail.com" className="footer-link">maijied@gmail.com</a>
              <a href={ecosystemLinks.developerGithub} className="footer-link" target="_blank" rel="noopener noreferrer">@Maijied GitHub</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Country Badge & Social Icons (Matching SS3) */}
        <div className="footer-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Lorapok Labs · Bangladesh
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              © 2026 Lorapok Labs. All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href={ecosystemLinks.githubOrg} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="GitHub Org">
              🐙
            </a>
            <a href="https://twitter.com/lorapoklabs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Twitter / X">
              🐦
            </a>
            <a href="mailto:contact@lorapok.tech" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Email">
              ✉️
            </a>
            <a href="https://linkedin.com/showcase/lorapok/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="LinkedIn">
              💼
            </a>
            <a href="https://reddit.com/r/LorapokLabs/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Reddit">
              💬
            </a>
            <a href="https://instagram.com/lorapoklabs/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Instagram">
              📷
            </a>
            <a href="https://facebook.com/lorapoklabs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Facebook">
              👥
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
