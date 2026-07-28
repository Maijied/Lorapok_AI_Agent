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
          {/* Animated Cybernetic IntelliJ SVG Logo Mark */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'radial-gradient(circle at 30% 30%, #1e1b4b 0%, #030711 80%)',
              border: '1.5px solid #22D3EE',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.45), inset 0 0 12px rgba(124, 58, 237, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {/* Spinning Outer Orbit */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 100 100"
              style={{
                position: 'absolute',
                animation: 'spinOrbit 8s linear infinite',
                opacity: 0.8
              }}
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="#7C3AED" strokeWidth="3" strokeDasharray="25 15" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="18 12" />
            </svg>

            {/* JetBrains Mono 'L' Core */}
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 900,
                fontSize: '1.1rem',
                color: '#22D3EE',
                textShadow: '0 0 10px rgba(34, 211, 238, 0.9)',
                position: 'relative',
                zIndex: 2,
                animation: 'pulseGlow 2.5s ease-in-out infinite'
              }}
            >
              L
            </span>

            {/* Glowing Emerald Pulse Dot */}
            <span
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }}
            />
          </div>

          <span className="nav-brand-text lorapok-brand-font">
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
