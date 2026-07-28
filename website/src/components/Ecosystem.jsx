import React, { useState } from 'react';
import { ecosystemProjects, ecosystemLinks } from '../data/ecosystemProjects';

const categories = ['All Products', 'AI & Agents', 'Developer Tools', 'Productivity & Media'];

export default function Ecosystem() {
  const [activeCategory, setActiveCategory] = useState('All Products');

  const filtered = activeCategory === 'All Products'
    ? ecosystemProjects
    : ecosystemProjects.filter(p => p.category === activeCategory);

  return (
    <section className="ecosystem" id="ecosystem">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge purple">🌌 Complete Open-Source Ecosystem</span>
          <h2 className="section-title">
            The <span className="gradient-text">Lorapok Labs</span> Universe
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Explore 18+ open-source products, AI tools, and developer platforms engineered by{' '}
            <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer">
              {ecosystemLinks.developerName}
            </a>{' '}
            and <a href={ecosystemLinks.labsWebsite} target="_blank" rel="noopener noreferrer">Lorapok Labs</a>.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="providers-tabs" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`provider-tab-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({cat === 'All Products' ? ecosystemProjects.length : ecosystemProjects.filter(p => p.category === cat).length})
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="ecosystem-grid">
          {filtered.map(proj => (
            <div key={proj.id} className="eco-card glass-card glass-card-interactive">
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

        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <a
            href={ecosystemLinks.labsWebsite}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}
          >
            Visit Lorapok Labs Hub (lorapok.tech) 🌐
          </a>
        </div>
      </div>
    </section>
  );
}
