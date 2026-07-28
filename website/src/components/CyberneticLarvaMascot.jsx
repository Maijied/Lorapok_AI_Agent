import React, { useState, useEffect } from 'react';

const statusMessages = [
  '🔍 186/186 Unit Tests Verified',
  '🔬 Sensory Computing Active',
  '⚡ System Bottlenecks Consumed',
  '🛡️ Zero-Quota Filter Running',
  '🌐 LLDP Pattern Architecture v2.0',
  '🐛 Friendly Helper Active'
];

export default function CyberneticLarvaMascot({ showToast }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('research');
  const [bottleneckCount, setBottleneckCount] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleConsumeBottlenecks = () => {
    setBottleneckCount((prev) => prev + 1);
    if (showToast) showToast(`🐛 Consumed Bottleneck #${bottleneckCount + 1}! System Optimized.`);
  };

  return (
    <>
      {/* Floating Bottom-Left Mascot Widget */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          left: '1.75rem',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Pill Badge */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid #00FF88',
            borderRadius: '16px',
            padding: '0.5rem 0.95rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#00FF88',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.25)',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            maxWidth: '230px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {statusMessages[statusIndex]}
        </div>

        {/* Cybernetic Black Soldier Fly Larva Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 136, 0.25) 0%, rgba(3, 7, 17, 0.95) 75%)',
            border: '2px solid #00FF88',
            boxShadow: '0 0 25px rgba(0, 255, 136, 0.45), inset 0 0 15px rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isHovered ? 'scale(1.12) translateY(-4px)' : 'scale(1)'
          }}
        >
          <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
            {/* Segmented Charcoal Armor Body */}
            <ellipse cx="50" cy="50" rx="34" ry="24" fill="#1A202C" stroke="#00FF88" strokeWidth="2.5" />
            <path d="M 30 36 Q 50 28 70 36" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M 26 50 Q 50 42 74 50" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 30 64 Q 50 56 70 64" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />

            {/* Glowing Expressive Eyes */}
            <circle cx="38" cy="46" r="6" fill="#00FF88" />
            <circle cx="62" cy="46" r="6" fill="#00FF88" />
            <circle cx="40" cy="44" r="2" fill="#FFFFFF" />
            <circle cx="64" cy="44" r="2" fill="#FFFFFF" />

            {/* Smile */}
            <path d="M 44 58 Q 50 64 56 58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />

            {/* Small Robotic Legs */}
            <line x1="22" y1="52" x2="14" y2="58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="62" x2="16" y2="70" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
            <line x1="78" y1="52" x2="86" y2="58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
            <line x1="76" y1="62" x2="84" y2="70" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Active Pulse Dot */}
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#00FF88',
              boxShadow: '0 0 10px #00FF88',
              animation: 'pulseDot 2s infinite'
            }}
          />
        </div>
      </div>

      {/* Cybernetic Larva Assistant & Lorapok Labs Hub Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 17, 0.88)',
            backdropFilter: 'blur(24px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              border: '1px solid #00FF88',
              boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(0,255,136,0.15)',
                  border: '1px solid #00FF88',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}
              >
                🐛
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Cybernetic <span style={{ color: '#00FF88' }}>Larva Assistant</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Lorapok Labs Friendly System Optimizer &amp; Research Hub
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <button
                className={`scenario-btn ${activeTab === 'research' ? 'active' : ''}`}
                onClick={() => setActiveTab('research')}
              >
                🔬 Research
              </button>
              <button
                className={`scenario-btn ${activeTab === 'connect' ? 'active' : ''}`}
                onClick={() => setActiveTab('connect')}
              >
                🌐 Connect &amp; Telemetry
              </button>
              <button
                className={`scenario-btn ${activeTab === 'bible' ? 'active' : ''}`}
                onClick={() => setActiveTab('bible')}
              >
                📖 Labs Bible
              </button>
            </div>

            {/* Tab 1: Research */}
            {activeTab === 'research' && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  Sensory Computing &amp; Biological UI
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Lorapok Labs researches low-latency sensory computing, biological UI patterns, and action-oriented AI agents designed to eliminate system bottlenecks.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleConsumeBottlenecks}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #00FF88, #059669)', color: '#030711', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    ⚡ Consume Bottleneck ({bottleneckCount})
                  </button>
                  <a
                    href="https://maijied.github.io/Lorapok-Labs-Bible/#/research"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Research Spec ↗
                  </a>
                </div>
              </div>
            )}

            {/* Tab 2: Connect */}
            {activeTab === 'connect' && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-purple-light)', marginBottom: '0.5rem' }}>
                  Developer Telemetry &amp; Network
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Connect with the Lorapok open-source developer ecosystem, inspect real-time agent telemetry, and contribute to Lorapok tools.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href="https://maijied.github.io/Lorapok-Labs-Bible/#/connect"
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Connect Portal 🌐
                  </a>
                  <a
                    href="https://github.com/Lorapok"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Org 🐙
                  </a>
                </div>
              </div>
            )}

            {/* Tab 3: Bible */}
            {activeTab === 'bible' && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
                  Lorapok Labs Design Pattern (LLDP)
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  The master engineering specification governing all Lorapok products — void-black surfaces, neon accents, and autonomous CLI orchestration.
                </p>
                <a
                  href="https://maijied.github.io/Lorapok-Labs-Bible/#/"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read Lorapok Bible 📖
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
