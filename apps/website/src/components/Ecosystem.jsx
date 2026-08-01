import React, { useState } from 'react';
import { ecosystemProjects, ecosystemLinks } from '../data/ecosystemProjects';

const categories = ['All Products', 'AI & Agents', 'Developer Tools', 'Productivity & Extensions', 'Media & Entertainment'];

export default function Ecosystem() {
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filtered = ecosystemProjects.filter(p => {
    const matchesCategory = activeCategory === 'All Products' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Display top 3 unless expanded, searching, or filtering by category
  const shouldTruncate = !isExpanded && searchQuery === '' && activeCategory === 'All Products';
  const displayedProjects = shouldTruncate ? filtered.slice(0, 3) : filtered;

  return (
    <section className="ecosystem" id="ecosystem">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge purple">🌌 Complete Open-Source Ecosystem</span>
          <h2 className="section-title">
            The <span className="gradient-text">Lorapok Labs</span> Universe
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Explore {ecosystemProjects.length}+ open-source products, AI systems, developer tools, and cybernetic apps built by{' '}
            <a href={ecosystemLinks.developerGithub} target="_blank" rel="noopener noreferrer">
              {ecosystemLinks.developerName}
            </a>{' '}
            and <a href={ecosystemLinks.labsWebsite} target="_blank" rel="noopener noreferrer">Lorapok Labs</a>.
          </p>
        </div>

        {/* Search Bar & Category Filter Tabs */}
        <div style={{ marginTop: '2.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <input
            type="text"
            placeholder="🔍 Search 30+ Lorapok products & repos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              maxWidth: '450px',
              width: '100%',
              padding: '0.75rem 1.25rem',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-cyan)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.92rem',
              outline: 'none',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-glass)'
            }}
          />

          <div className="providers-tabs" style={{ marginTop: 0, marginBottom: 0 }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`provider-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat);
                  setIsExpanded(true); // Auto expand when user filters by category
                }}
              >
                {cat} ({cat === 'All Products' ? ecosystemProjects.length : ecosystemProjects.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="ecosystem-grid">
          {displayedProjects.map(proj => (
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

        {/* Animated Collapsible Show All / Show Less Button */}
        {searchQuery === '' && activeCategory === 'All Products' && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 2.2rem',
                fontSize: '0.98rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                boxShadow: '0 0 25px var(--accent-purple-glow)',
                gap: '0.6rem',
                transition: 'all 0.3s ease'
              }}
            >
              {isExpanded ? (
                <>
                  <span>Show Top Products</span>
                  <span style={{ fontSize: '0.85rem' }}>▲</span>
                </>
              ) : (
                <>
                  <span>Show All Products ({ecosystemProjects.length})</span>
                  <span style={{ fontSize: '0.85rem' }}>▼</span>
                </>
              )}
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No products found matching "{searchQuery}". Try clearing search.
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <a
            href={ecosystemLinks.labsWebsite}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '0.85rem 2.2rem', fontSize: '0.98rem' }}
          >
            Visit Lorapok Labs Hub (lorapok.tech) 🌐
          </a>
        </div>
      </div>
    </section>
  );
}
