import React, { useEffect, useRef, useState } from 'react';
import AgenticSimulation from './AgenticSimulation';

const phrases = [
  'Plan. Code. Execute.',
  'Commit. Deploy. Ship.',
  'Analyze. Refactor. Test.',
  'Debug. Optimize. Scale.'
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
    let speed = isDeleting ? 40 : 75;

    if (!isDeleting && charIndex === currentPhrase.length) {
      speed = 2200; // Pause at full phrase
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % phrases.length);
      speed = 400;
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

  // Canvas particle background
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
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.opacity = Math.random() * 0.15 + 0.05;
        this.size = Math.random() * 6 + 10;
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

    const count = Math.min(45, Math.floor(window.innerWidth / 35));
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
    <section className="hero" id="hero" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div className="hero-gradient-orb purple" />
      <div className="hero-gradient-orb cyan" />
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Top Center Single-Line Typewriter Banner */}
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '0 1.5rem',
          overflow: 'hidden'
        }}
      >
        <div className="hero-badge" style={{ marginBottom: '1rem' }}>
          <span className="pulse-dot" />
          A Product of Lorapok Labs
        </div>

        {/* Single-Line Typewriter Text Container */}
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 'clamp(1.5rem, 3.8vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '3.5rem'
          }}
        >
          <span className="gradient-text">{currentText}</span>
          <span
            className="term-cursor"
            style={{
              height: '0.95em',
              width: 4,
              display: 'inline-block',
              background: '#22D3EE',
              boxShadow: '0 0 10px #22D3EE',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      {/* 2-Column Hero Content Grid */}
      <div className="hero-content">
        {/* Left Column: Title & Actions */}
        <div className="hero-text">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
            <span style={{ color: 'var(--text-primary)' }}>
              Autonomous Agentic Coding Simulation
            </span>
          </h1>

          <p className="hero-subtitle">
            <span className="lorapok-brand-font" style={{ color: 'var(--text-primary)' }}>Lorapok AI</span> is your autonomous terminal-first coding agent built on LLDP.
            Scaffolds code, executes test suites, inspects Git diffs, and orchestrates multi-provider AI models across Google Gemini, OpenRouter &amp; Perplexity AI.
          </p>

          <div className="hero-actions">
            <div className="install-box">
              <span className="prompt">$</span>
              <code>npm install -g lorapok-ai</code>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <a
              href="https://github.com/Maijied/Lorapok_AI_Agent"
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub Repo
            </a>
          </div>

          {/* Upgraded Professional Engineering Metrics */}
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">186+</div>
              <div className="hero-stat-label">Unit Tests Passing</div>
            </div>
            <div>
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Core AI Engines</div>
            </div>
            <div>
              <div className="hero-stat-value">25+</div>
              <div className="hero-stat-label">LLM Models Supported</div>
            </div>
            <div>
              <div className="hero-stat-value">0ms</div>
              <div className="hero-stat-label">Direct CLI Latency</div>
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
