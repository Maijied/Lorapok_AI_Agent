import React from 'react';
import { ecosystemProjects, ecosystemLinks } from '../data/ecosystemProjects';

export default function Ecosystem() {
  return (
    <section className="ecosystem" id="ecosystem">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge purple">🌌 Product Ecosystem</span>
          <h2 className="section-title">
            The <span className="gradient-text">Lorapok Labs</span> Universe
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Lorapok Labs is an open-source product ecosystem blending biological UI, sensory computing, and practical engineering by{' '}
            <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer">
              {ecosystemLinks.developerName}
            </a>.
          </p>
        </div>

        <div className="ecosystem-grid">
          {ecosystemProjects.map(proj => (
            <div key={proj.id} className={`eco-card glass-card glass-card-interactive ${proj.featured ? 'featured' : ''}`}>
              <div>
                <div className="eco-header">
                  <span className="eco-icon">{proj.icon}</span>
                  <span className="eco-badge">{proj.badge}</span>
                </div>
                <h3 className="eco-title">{proj.name}</h3>
                <div className="eco-tagline">{proj.tagline}</div>
                <p className="eco-desc">{proj.description}</p>
              </div>

              <div className="eco-footer">
                <span className="eco-stats">{proj.stats}</span>
                <div className="eco-links">
                  {proj.url && (
                    <a href={proj.url} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} target="_blank" rel="noopener noreferrer">
                      Website ↗
                    </a>
                  )}
                  {proj.github && (
                    <a href={proj.github} className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <a
            href={ecosystemLinks.labsWebsite}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}
          >
            Explore Lorapok Labs (lorapok.tech) 🌐
          </a>
        </div>
      </div>
    </section>
  );
}
