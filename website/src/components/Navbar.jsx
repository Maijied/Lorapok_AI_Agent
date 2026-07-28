import React, { useState, useEffect } from 'react';

export default function Navbar({ onOpenAdmin }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="nav-brand">
          {/* Animated IntelliJ / JetBrains Style Cybernetic Badge Logo */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              border: '1.5px solid #22D3EE',
              boxShadow: '0 0 15px rgba(34, 211, 238, 0.4), inset 0 0 10px rgba(124, 58, 237, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 900,
                fontSize: '1rem',
                color: '#22D3EE',
                textShadow: '0 0 8px rgba(34, 211, 238, 0.8)'
              }}
            >
              L
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 6px #10B981'
              }}
            />
          </div>

          <span
            className="nav-brand-text"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              letterSpacing: '-0.02em'
            }}
          >
            Lorapok <span className="gradient-text">AI</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#providers" className="nav-link">Providers</a>
          <a href="#api" className="nav-link">API</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#ecosystem" className="nav-link">Ecosystem</a>
          <button onClick={onOpenAdmin} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Admin
          </button>
        </div>

        <a href="#install" className="btn btn-primary nav-cta desktop-only">
          Get Started Free
        </a>

        <button
          className={`nav-hamburger ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="Toggle Navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`}>
        <a href="#features" className="nav-link" onClick={() => setDrawerOpen(false)}>Features</a>
        <a href="#how-it-works" className="nav-link" onClick={() => setDrawerOpen(false)}>How It Works</a>
        <a href="#providers" className="nav-link" onClick={() => setDrawerOpen(false)}>Providers</a>
        <a href="#api" className="nav-link" onClick={() => setDrawerOpen(false)}>API</a>
        <a href="#pricing" className="nav-link" onClick={() => setDrawerOpen(false)}>Pricing</a>
        <a href="#ecosystem" className="nav-link" onClick={() => setDrawerOpen(false)}>Ecosystem</a>
        <button
          onClick={() => { setDrawerOpen(false); onOpenAdmin(); }}
          className="nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          Admin Panel
        </button>
        <div style={{ marginTop: '1rem' }}>
          <a href="#install" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setDrawerOpen(false)}>
            Get Started Free
          </a>
        </div>
      </div>
    </nav>
  );
}
