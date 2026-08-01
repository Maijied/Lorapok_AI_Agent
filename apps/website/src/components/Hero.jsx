import React, { useEffect, useRef, useState } from 'react';
import AgenticSimulation from './AgenticSimulation';

const phrases = [
  'Lorapok AI — Autonomous Coding Agent',
  'Plan. Scaffold. Execute. Commit.',
  'Multi-Engine AI Architecture — 25+ LLMs',
  'Zero-Config CLI — Instant Setup',
  'Silent Background Bottleneck Optimization',
  'Automated Test Suite Execution'
];

export default function Hero({ showToast }) {
  const [copied, setCopied] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const canvasRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    const currentPhrase = phrases[textIndex];
    let speed = isDeleting ? 30 : 60;

    if (!isDeleting && charIndex === currentPhrase.length) {
      speed = 2500; // Pause at full phrase
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % phrases.length);
      speed = 300;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
      if (!isDeleting && charIndex === currentPhrase.length) {
        setIsDeleting(true);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  // Copy command handler
  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g lorapok-ai');
    setCopied(true);
    showToast('✓ Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Canvas particle background with ultra-subtle floating code symbols (No collisions)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const symbols = ['{ }', '</>', '//', '=>', 'fn()', '[ ]', '&&', '||', '++', '::'];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.opacity = Math.random() * 0.08 + 0.03; // Ultra-subtle background opacity
        this.size = Math.random() * 4 + 11;
        this.life = Math.random() * 500 + 300;
        this.age = 0;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        if (this.age > this.life || this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
          this.reset();
        }
      }
      draw() {
        const fade = this.age < 30 ? this.age / 30 : this.age > this.life - 30 ? (this.life - this.age) / 30 : 1;
        ctx.globalAlpha = this.opacity * fade;
        ctx.font = `${this.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = this.age % 2 === 0 ? '#7C3AED' : '#22D3EE';
        ctx.fillText(this.symbol, this.x, this.y);
      }
    }

    const count = Math.min(35, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const currentText = phrases[textIndex].substring(0, charIndex);

  return (
    <section className="hero" id="hero" style={{ flexDirection: 'column', gap: '2.5rem', paddingTop: 'calc(var(--nav-height) + 2.5rem)', paddingBottom: '5rem' }}>
      <div className="hero-gradient-orb purple" />
      <div className="hero-gradient-orb cyan" />
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Top Center Typewriter Banner (Generous Spacing & Beta Badge) */}
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto 1.5rem',
          padding: '0 1.5rem'
        }}
      >
        <div className="hero-badge" style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-purple)' }}>
          <span className="pulse-dot" />
          A Product of Lorapok Labs · <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>Beta v2.0</span>
        </div>

        {/* Responsive Typewriter Container */}
        <div
          style={{
            minHeight: '3.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(0.95rem, 2.2vw, 1.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              maxWidth: '100%'
            }}
          >
            <span className="gradient-text">{currentText}</span>
            <span
              className="term-cursor"
              style={{
                height: '0.9em',
                width: 4,
                display: 'inline-block',
                background: '#22D3EE',
                boxShadow: '0 0 10px #22D3EE',
                flexShrink: 0
              }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Hero Content Grid */}
      <div className="hero-content" style={{ marginTop: '1rem', gap: '4rem' }}>
        {/* Left Column: Title & Install Action */}
        <div className="hero-text">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-primary)' }}>
              Autonomous Agentic Coding Simulation
            </span>
          </h1>

          <p className="hero-subtitle" style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            <span className="lorapok-brand-font" style={{ color: 'var(--text-primary)' }}>Lorapok AI</span> is your autonomous terminal-first coding agent built on LLDP.
            Scaffolds code, executes test suites, inspects Git diffs, and orchestrates multi-provider AI models across Google Gemini, OpenRouter &amp; Perplexity AI.
          </p>

          <div className="hero-actions" style={{ marginBottom: '2.5rem' }}>
            <div className="install-box" style={{ padding: '0.85rem 1.25rem', width: '100%', maxWidth: '380px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="prompt">$</span>
                <code>npm install -g lorapok-ai</code>
              </div>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy to clipboard"
                style={{ fontSize: '1rem' }}
              >
                📋
              </button>
            </div>
          </div>

          {/* Upgraded 3 Stat Metrics */}
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">LLDP</div>
              <div className="hero-stat-label">Agentic Protocol</div>
            </div>
            <div>
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Open Source &amp; Free</div>
            </div>
            <div>
              <div className="hero-stat-value">v1.2.0</div>
              <div className="hero-stat-label">Latest Engine Version</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Agentic Simulation Terminal */}
        <div>
          <AgenticSimulation />
        </div>
      </div>
    </section>
  );
}
