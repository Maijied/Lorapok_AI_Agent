import React from 'react';

const providers = [
  {
    icon: '✨',
    name: 'Google AI Studio',
    models: 'Gemini 3.6 Flash · Gemini 3.5 Flash-Lite · Gemini 2.0 Flash',
    badge: '100% Free Tier',
    badgeClass: 'free',
    bg: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(156,39,176,0.15))'
  },
  {
    icon: '🔀',
    name: 'OpenRouter Engine',
    models: 'Claude 3.7 Sonnet · GPT-4o · DeepSeek R1 · Llama 3.3 70B',
    badge: 'Multi-Model Access',
    badgeClass: 'multi',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))'
  },
  {
    icon: '🔍',
    name: 'Perplexity AI',
    models: 'Sonar · Sonar Pro · Sonar Reasoning',
    badge: 'Search Grounding',
    badgeClass: 'search',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.15))'
  }
];

export default function Providers() {
  return (
    <section className="providers" id="providers">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">🌐 Multi-Provider Engine</span>
          <h2 className="section-title">
            Choose Your <span className="gradient-text">AI Powerhouse</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Lorapok AI connects to three leading AI providers. Switch models on-the-fly with a single command.
          </p>
        </div>

        <div className="providers-grid">
          {providers.map((p, i) => (
            <div key={i} className="provider-card glass-card glass-card-interactive">
              <div className="provider-icon" style={{ background: p.bg }}>{p.icon}</div>
              <h3 className="provider-name">{p.name}</h3>
              <p className="provider-models">{p.models}</p>
              <span className={`provider-badge ${p.badgeClass}`}>{p.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
