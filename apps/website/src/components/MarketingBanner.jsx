import React from 'react';

export default function MarketingBanner() {
  return (
    <div className="marketing-banner" style={{
      width: '100%',
      padding: '4rem 2rem',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 10, 40, 0.95))',
      borderBottom: '1px solid var(--border-purple)',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 10
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-50%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="hero-badge" style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-cyan)' }}>
          <span className="pulse-dot" style={{ background: '#22D3EE', boxShadow: '0 0 10px #22D3EE' }} />
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>BIG UPDATE — BETA RELEASE</span>
        </div>
        
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
          The Future of Autonomous Coding<br/>
          <span className="gradient-text">Arrives Tomorrow.</span>
        </h2>
        
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '700px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Lorapok Agentic AI isn't just another coding assistant—it's a proactive, multi-provider AI coding agent built to autonomously architect, implement, and verify your workflows. Pair program with the future.
        </p>

        <div style={{
          width: '100%',
          maxWidth: '900px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-purple)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(124, 58, 237, 0.2)',
          marginBottom: '2rem'
        }}>
          <img 
            src="/assets/LorapokOrginalcLI.png" 
            alt="Lorapok Agentic AI Beta Release" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#features" className="primary-btn" style={{ textDecoration: 'none', padding: '0.8rem 2rem', borderRadius: '8px', background: 'var(--accent-cyan)', color: '#030711', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Explore Features <span>↓</span>
          </a>
        </div>
      </div>
    </div>
  );
}
