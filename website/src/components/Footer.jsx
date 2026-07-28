import React from 'react';
import LarvaLogo from './LarvaLogo';
import { ecosystemLinks } from '../data/ecosystemProjects';

const socialCards = [
  {
    name: 'GitHub Org',
    url: ecosystemLinks.githubOrg,
    displayUrl: 'github.com/Lorapok',
    icon: '🐙'
  },
  {
    name: 'Developer GitHub',
    url: ecosystemLinks.developerGithub,
    displayUrl: 'github.com/maijied',
    icon: '👤'
  },
  {
    name: 'LinkedIn Showcase',
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
    name: 'Reddit Community',
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
    name: 'Wellfound Profile',
    url: 'https://wellfound.com/u/maizied',
    displayUrl: 'wellfound.com/u/maizied',
    icon: '💼'
  },
  {
    name: 'Developer Portfolio',
    url: 'https://maijied.github.io/Maijied',
    displayUrl: 'maijied.github.io/Maijied',
    icon: '🌐'
  }
];

export default function Footer() {
  return (
    <footer className="footer" id="footer" style={{ background: '#030711', borderTop: '1px solid var(--border-glass)', padding: '5rem 2rem 2.5rem' }}>
      <div className="container">

        {/* ── Section Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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

        {/* ── De-duplicated Social Grid Cards (Single Unified Row) ── */}
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
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(34, 211, 238, 0.12)',
                    border: '1px solid var(--border-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem'
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{card.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {card.displayUrl}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>↗</span>
            </a>
          ))}
        </div>

        {/* ── Main Footer Grid ── */}
        <div className="footer-grid" style={{ marginBottom: '3.5rem' }}>
          <div>
            <div className="footer-brand" style={{ marginBottom: '1rem' }}>
              <LarvaLogo size={42} showText={true} />
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
              <a href={ecosystemLinks.githubOrg} className="footer-link" target="_blank" rel="noopener noreferrer">GitHub Organization 🐙</a>
              <a href={ecosystemLinks.npmPackage} className="footer-link" target="_blank" rel="noopener noreferrer">npm Package Registry 📦</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/CHANGELOG.md" className="footer-link" target="_blank" rel="noopener noreferrer">Release Changelog 📋</a>
              <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/LICENSE" className="footer-link" target="_blank" rel="noopener noreferrer">MIT License 📜</a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Contact &amp; Support</h4>
            <div className="footer-links">
              <a href="mailto:lorapoklabs@gmail.com" className="footer-link" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                lorapoklabs@gmail.com ✉️
              </a>
              <a href="mailto:contact@lorapok.tech" className="footer-link">contact@lorapok.tech ✉️</a>
              <a href="mailto:maijied@gmail.com" className="footer-link">maijied@gmail.com ✉️</a>
              <a href={ecosystemLinks.developerGithub} className="footer-link" target="_blank" rel="noopener noreferrer">@Maijied GitHub 👤</a>
            </div>
          </div>
        </div>

        {/* ── Bottom Footer Bar ── */}
        <div className="footer-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.2rem' }}>🐛</span>
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
            <a href="mailto:lorapoklabs@gmail.com" className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title="Email">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
