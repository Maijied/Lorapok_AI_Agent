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
          <img src="assets/logo.png" alt="Lorapok AI" />
          <span className="nav-brand-text">
            Lorapok <span className="gradient-text">AI</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#ecosystem" className="nav-link">Ecosystem</a>
          <a href="#install" className="nav-link">Install</a>
          <a href="#providers" className="nav-link">Providers</a>
          <a href="#api" className="nav-link">API</a>
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
        <a href="#ecosystem" className="nav-link" onClick={() => setDrawerOpen(false)}>Ecosystem</a>
        <a href="#install" className="nav-link" onClick={() => setDrawerOpen(false)}>Install</a>
        <a href="#providers" className="nav-link" onClick={() => setDrawerOpen(false)}>Providers</a>
        <a href="#api" className="nav-link" onClick={() => setDrawerOpen(false)}>API</a>
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
