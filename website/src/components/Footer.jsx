import React from 'react';
import { ecosystemLinks } from '../data/ecosystemProjects';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-grid">
        {/* Column 1: Brand & Philosophy */}
        <div>
          <div className="footer-brand">
            <img src="assets/logo.png" alt="Lorapok AI" />
            <span className="footer-brand-name">
              Lorapok <span className="gradient-text">AI</span>
            </span>
          </div>
          <p className="footer-description">
            Autonomous, action-oriented AI coding agent for terminal engineering &amp; full-stack development. Built on the Lorapok Labs Design Pattern (LLDP).
          </p>
          <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ✉️ Contact: <a href="mailto:contact@lorapok.tech" style={{ color: 'var(--accent-cyan)' }}>contact@lorapok.tech</a>
          </div>
        </div>

        {/* Column 2: Research & Connect Hub */}
        <div>
          <h4 className="footer-heading">Research &amp; Telemetry</h4>
          <div className="footer-links">
            <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/research" className="footer-link" target="_blank" rel="noopener noreferrer">Lorapok Research 🔬</a>
            <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/connect" className="footer-link" target="_blank" rel="noopener noreferrer">Connect &amp; Telemetry 🌐</a>
            <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/" className="footer-link" target="_blank" rel="noopener noreferrer">Lorapok Labs Bible 📖</a>
            <a href="https://ai.lorapok.tech" className="footer-link">Lorapok AI Product Hub 🤖</a>
          </div>
        </div>

        {/* Column 3: Open-Source Resources */}
        <div>
          <h4 className="footer-heading">Resources &amp; Code</h4>
          <div className="footer-links">
            <a href={ecosystemLinks.githubOrg} className="footer-link" target="_blank" rel="noopener noreferrer">GitHub Organization 🐙</a>
            <a href={ecosystemLinks.npmPackage} className="footer-link" target="_blank" rel="noopener noreferrer">npm Package Registry 📦</a>
            <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/CHANGELOG.md" className="footer-link" target="_blank" rel="noopener noreferrer">Release Changelog 📋</a>
            <a href="https://github.com/Maijied/Lorapok_AI_Agent/blob/main/LICENSE" className="footer-link" target="_blank" rel="noopener noreferrer">MIT Open Source License 📜</a>
          </div>
        </div>

        {/* Column 4: Community & Social Links */}
        <div>
          <h4 className="footer-heading">Social &amp; Connect</h4>
          <div className="footer-links">
            <a href={ecosystemLinks.labsWebsite} className="footer-link" target="_blank" rel="noopener noreferrer">Lorapok Labs Hub (lorapok.tech) 🌐</a>
            <a href={ecosystemLinks.developerGithub} className="footer-link" target="_blank" rel="noopener noreferrer">Developer Profile (@Maijied) 👤</a>
            <a href="https://maijied.github.io/Lorapok-Labs-Bible/#/connect" className="footer-link" target="_blank" rel="noopener noreferrer">Community Discussion 💬</a>
            <a href="mailto:maijied@gmail.com" className="footer-link">Developer Email ✉️</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          Built with 🐛 Cybernetic Larva by <a href={ecosystemLinks.labsWebsite} target="_blank" rel="noopener noreferrer">Lorapok Labs</a> · © 2026 All rights reserved.
        </span>
        <div className="footer-social">
          <a href={ecosystemLinks.githubOrg} target="_blank" rel="noopener noreferrer" aria-label="GitHub Org" title="GitHub Organization">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a href={ecosystemLinks.npmPackage} target="_blank" rel="noopener noreferrer" aria-label="npm Package" title="npm Package">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z"/>
            </svg>
          </a>
          <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer" aria-label="Developer GitHub" title="Developer Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
