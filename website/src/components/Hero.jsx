import React, { useEffect, useRef, useState } from 'react';
import AgenticSimulation from './AgenticSimulation';

export default function Hero({ showToast }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  // Copy command handler
  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g lorapok-ai');
    setCopied(true);
    showToast('✓ Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Canvas particle effect
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

  return (
    <section className="hero" id="hero">
      <div className="hero-gradient-orb purple" />
      <div className="hero-gradient-orb cyan" />
      <canvas ref={canvasRef} className="hero-canvas" />

      <div className="hero-content">
        {/* Left Column: Text & Actions */}
        <div className="hero-text">
          <div className="hero-badge">
            <span className="pulse-dot" />
            A Product of Lorapok Labs
          </div>

          <h1 className="hero-title">
            Autonomous <span className="gradient-text">Agentic</span> Coding Simulation
          </h1>

          <p className="hero-subtitle">
            Lorapok AI is your terminal-first coding agent that plans, writes, verifies, and commits code.
            Powered by Google Gemini, OpenRouter &amp; Perplexity AI.
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

          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">186+</div>
              <div className="hero-stat-label">Tests Passing</div>
            </div>
            <div>
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">AI Engines</div>
            </div>
            <div>
              <div className="hero-stat-value">12+</div>
              <div className="hero-stat-label">CLI Features</div>
            </div>
            <div>
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Free Tier</div>
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
