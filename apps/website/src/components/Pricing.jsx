import React from 'react';

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">💎 Pricing Plans</span>
          <h2 className="section-title">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Start free with full access to core features. Upgrade when you need enterprise power.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier Card */}
          <div className="pricing-card glass-card glass-card-interactive">
            <div className="pricing-tier">Free Tier</div>
            <div className="pricing-price gradient-text">$0</div>
            <div className="pricing-period">Forever Free</div>
            <div className="pricing-features">
              <div className="pricing-feature"><span className="check">✓</span> Interactive AI chat &amp; REPL</div>
              <div className="pricing-feature"><span className="check">✓</span> Proactive chunked file editing</div>
              <div className="pricing-feature"><span className="check">✓</span> Full Git workflow suite</div>
              <div className="pricing-feature"><span className="check">✓</span> GitHub Actions manager</div>
              <div className="pricing-feature"><span className="check">✓</span> Terminal UI with 12+ themes</div>
              <div className="pricing-feature"><span className="check">✓</span> Google AI Studio (100% Free)</div>
              <div className="pricing-feature"><span className="check">✓</span> Docker container environment</div>
              <div className="pricing-feature"><span className="check">✓</span> Response caching</div>
            </div>
            <a href="#install" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Get Started Free
            </a>
          </div>

          {/* Pro Card with Fixed POPULAR Badge */}
          <div className="pricing-card glass-card glass-card-interactive featured">
            <div className="pricing-badge-popular">POPULAR</div>
            <div className="pricing-tier">Pro / Enterprise</div>
            <div className="pricing-price"><span className="gradient-text-amber">Pro</span></div>
            <div className="pricing-period">Coming Soon</div>
            <div className="pricing-features">
              <div className="pricing-feature"><span className="check">✓</span> Everything in Free</div>
              <div className="pricing-feature"><span className="check">✓</span> High-throughput reasoning models</div>
              <div className="pricing-feature"><span className="check">✓</span> Advanced context caching</div>
              <div className="pricing-feature"><span className="check">✓</span> Priority execution queues</div>
              <div className="pricing-feature"><span className="check">✓</span> Enterprise repo automation</div>
              <div className="pricing-feature"><span className="check">✓</span> Team collaboration tools</div>
              <div className="pricing-feature"><span className="check">✓</span> Custom model fine-tuning</div>
            </div>
            <a href="mailto:contact@lorapok.tech" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Contact Lorapok Labs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
