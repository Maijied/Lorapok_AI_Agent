import React from 'react';

const coreThemes = [
  {
    num: '01',
    title: 'Zero-Config Efficiency',
    desc: 'Tools that work out of the box. No setup, no boilerplate, no configuration fatigue. Install and go.',
    icon: '⚡'
  },
  {
    num: '02',
    title: 'Silent Background Optimization',
    desc: 'Like the biological mascot itself — systems that quietly consume bottlenecks, optimize resources, and improve performance without user intervention.',
    icon: '🐛'
  },
  {
    num: '03',
    title: 'Playful Neuroscience',
    desc: 'Interfaces that delight through subtle motion, luminescence, and organic feedback. The brain responds to living things — our UIs exploit that.',
    icon: '🧠'
  },
  {
    num: '04',
    title: 'Digital Metamorphosis',
    desc: 'Software evolves. Continuously ship, iterate, transform. Each version is a new larval stage closer to its final form.',
    icon: '🧬'
  }
];

export default function ResearchPhilosophy() {
  return (
    <section className="philosophy" id="philosophy" style={{ padding: '6rem 2rem', position: 'relative' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge purple">🔬 Biological UI &amp; Engineering Philosophy</span>
          <h2 className="section-title">
            Research &amp; <span className="gradient-text">Core Philosophy</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            The principles that guide every line of code across the Lorapok Labs ecosystem.
          </p>
        </div>

        {/* Founder Quote Card */}
        <div
          className="glass-card glass-card-interactive"
          style={{
            maxWidth: '860px',
            margin: '3rem auto 4rem',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid var(--border-purple)',
            boxShadow: '0 0 45px var(--accent-purple-glow)'
          }}
        >
          <div style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '1rem' }}>💬</div>
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 500,
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              marginBottom: '1.5rem'
            }}
          >
            “The best products aren't built overnight — they're built consistently, one shipped feature at a time. That's the only philosophy I know.”
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              MH
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Mohammad Maizied Hasan Majumder
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Founder &amp; Principal Engineer, Lorapok Labs
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Themes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '4rem' }}>
          {coreThemes.map((theme) => (
            <div key={theme.num} className="glass-card glass-card-interactive" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{theme.icon}</span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: 'var(--accent-purple-light)',
                    opacity: 0.6
                  }}
                >
                  {theme.num}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                {theme.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {theme.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Open Source Commitment & Future Vision Dual Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Open Source Commitment */}
          <div
            className="glass-card glass-card-interactive"
            style={{
              padding: '2.5rem',
              border: '1px solid var(--border-cyan)',
              background: 'rgba(15, 23, 42, 0.75)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="section-badge" style={{ marginBottom: '1rem' }}>
              📜 Open Source Commitment
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              100% Free &amp; Transparent Engineering
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
              Every product in the Lorapok Labs ecosystem is open source under the MIT license. We believe developer tools should be free, transparent, and community-driven.
            </p>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The source code is a living document — readable, maintainable, and welcoming to contributors. No proprietary lock-in. No hidden dependencies. Just clean, honest engineering.
            </p>
          </div>

          {/* Future Vision */}
          <div
            className="glass-card glass-card-interactive"
            style={{
              padding: '2.5rem',
              border: '1px solid var(--border-purple)',
              background: 'rgba(15, 23, 42, 0.75)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="section-badge purple" style={{ marginBottom: '1rem' }}>
              🌌 Future Vision &amp; Biological UI
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Self-Reinforcing Living Workspace
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
              Lorapok Labs is building toward an interconnected ecosystem where each tool enhances the others: Atlas provides API discovery, the AI Agent generates integration code, the Media Player handles content, and the Monitor ensures performance.
            </p>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The end state: a complete development environment that feels less like a toolbox and more like a living workspace — adapting, learning, and growing alongside the developer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
